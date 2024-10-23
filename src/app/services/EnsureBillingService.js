import { query } from "express";
import shopify from "../../configs/shopify.js";
import { NODE_ENV } from "../../configs/app.js";

export class EnsureBillingService {
    static INTERVAL_ONE_TIME = "ONE_TIME";
    static INTERVAL_EVERY_30_DAYS = "EVERY_30_DAYS";
    static INTERVAL_ANNUAL = "ANNUAL";
    static getRecurringIntervals() {
        return [
            this.INTERVAL_EVERY_30_DAYS,
            this.INTERVAL_ANNUAL
        ];
    }
    
    static RECURRING_PURCHASES_QUERY = `
        query appSubscription {
            currentAppInstallation {
            activeSubscriptions {
                name
                test
            }
            }
        }
        `;

    static ONE_TIME_PURCHASES_QUERY = `
        query appPurchases($endCursor: String) {
            currentAppInstallation {
                oneTimePurchases(first: 250, sortKey: CREATED_AT, after: $endCursor) {
                    edges {
                        node {
                            name
                            test
                            status
                        }
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        }
    `;

    static ONE_TIME_PURCHASE_MUTATION = `
        mutation createPaymentMutation(
            $name: String!
            $price: MoneyInput!
            $returnUrl: URL!
            $test: Boolean
        ) {
            appPurchaseOneTimeCreate(
                name: $name
                price: $price
                returnUrl: $returnUrl
                test: $test
            ) {
                confirmationUrl
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    static RECURRING_PURCHASE_MUTATION = `
        mutation createPaymentMutation(
            $name: String!
            $lineItems: [AppSubscriptionLineItemInput!]!
            $returnUrl: URL!
            $test: Boolean
        ) {
            appSubscriptionCreate(
                name: $name
                lineItems: $lineItems
                returnUrl: $returnUrl
                test: $test
            ) {
                confirmationUrl
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    static async check(session, config, forceConfirmUrl = false) {
        let confirmationUrl = null;
        let hasPayment;

        hasPayment = !!(!config.checkPayment && await this.hasActivePayment(session, config));

        if (forceConfirmUrl || !hasPayment) {
            confirmationUrl = await this.requestPayment(session, config);
        }
        return confirmationUrl;
    }

    static async hasActivePayment(session, config) {
        if (this.isRecurring(config)) {
            return await this.hasSubscription(session, config);
        }
        return await this.hasOneTimePayment(session, config);
    }

    static isRecurring(config) {
        return this.getRecurringIntervals().includes(config.interval);
    }

    static async hasSubscription(session, config) {
        const response = await this.queryOrException(session, this.RECURRING_PURCHASES_QUERY);
        const subscriptions = response.currentAppInstallation.activeSubscriptions;
        subscriptions.forEach(subscription => {
            if ((subscription['name'] === config.chargeName) && (!this.isProd() || !subscription['test'])) {
                return true;
            }
        });
        return false;
    }

    static async hasOneTimePayment(session, config) {
        let purchases;
        let endCursor;
        do {
            const response = await this.queryOrException(session, {
                query: this.ONE_TIME_PURCHASES_QUERY,
                variables: { endCursor }
            })

            purchases = response.currentAppInstallation.oneTimePurchases;

            if (purchases) {
                for (const purchase of purchases.edges) {
                    const node = purchase.node;
                    if (
                        node.name === config.chargeName &&
                        (!this.isProd() || !node.test) &&
                        node.status === "ACTIVE"
                    ) {
                        return true;
                    }
                }
                endCursor = purchases.pageInfo.endCursor;
            }

        } while (purchases && purchases.pageInfo.hasNextPage);

        return false;
    }

    static async requestPayment(session, config) {
        const shop = session.shop;
        const host = btoa(`${shop}/admin`);

        const queryParams = new URLSearchParams({
            shop: shop,
            host: host,
            plan: config.planId,
            is_installed: config.is_installed || false
        }).toString();

        const returnUrl = config.returnUrl || `${process.env.APP_URL}/login/api/shopify/plan/callback?${queryParams}`

        let data = null;
        if (this.isRecurring(config)) {
            const response = await this.requestRecurringPayment(session, config, returnUrl);
            data = response.appSubscriptionCreate;
        } else {
            const response = await this.requestOneTimePayment(session, config, returnUrl);
            data = response.appPurchaseOneTimeCreate;
        }
        return data.confirmationUrl;
    }

    static async requestOneTimePayment(session, config, returnUrl){
        const variables = {
            name: config.chargeName,
            price: {
                amount: config.amount,
                currencyCode: config.currencyCode
            },
            returnUrl: returnUrl,
            test: !this.isProd()
        }

        const payload = {
            query: this.ONE_TIME_PURCHASE_MUTATION,
            variables: variables
        }

        return await this.queryOrException(session, payload);
    }

    static async requestRecurringPayment(session, config, returnUrl) {
        const variables = {
            name: config.chargeName,
            lineItems: {
                plan: {
                    appRecurringPricingDetails: {
                        interval: config.interval,
                        price: {
                            amount: config.amount,
                            currencyCode: config.currencyCode
                        }
                    }
                }
            },
            returnUrl: returnUrl,
            test: !this.isProd()
        };

        const payload = {
            query: this.RECURRING_PURCHASE_MUTATION,
            variables: variables
        }

        return await this.queryOrException(session, payload);
    }

    static isProd() {
        return NODE_ENV === 'production';
    }

    static async queryOrException(session, query) {
        const client = new shopify.clients.Graphql({ session });
        const response = await client.query({
            data: query
        })
        return response.body?.data || null;
    }
}