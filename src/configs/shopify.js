import '@shopify/shopify-api/adapters/node';
import {shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-07';
import { getShopifyScopes, removeProtocol } from "../app/utils/func.js";

const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: getShopifyScopes(process.env.SHOPIFY_SCOPES),
    hostName: removeProtocol(process.env.APP_URL),
    hostScheme: 'https',
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: true,
    restResources,
    billing: undefined,
    future: {
        lineItemBilling: true,
        customerAddressDefaultFix: true,
        unstable_managedPricingSupport: true,
    },
    webhooks: {
        path: "/etsapp1/api/webhooks",
    },
});
export default shopify;
