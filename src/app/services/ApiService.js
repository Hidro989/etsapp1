import shopify from "../../configs/shopify.js";
import {SessionShopifyApp} from "../lib/SessionShopifyApp.js";

export class ApiService {
    constructor(shop) {
        this.shop = shop;
    }

    getIdThemeActive = async () => {
        const response = await shopify.rest.Theme.all({
            session: await this.getShopSession()
        });

        if (Array.isArray(response?.data)) {
            const theme = response.data.find(theme => theme.role === 'main');
            return theme ? theme.id : null;
        }

        return null;
    }

    getShopSession = async () => {
        try {
            if (this.shop) {
                return await SessionShopifyApp.loadSession(shopify.session.getOfflineId(this.shop));
            }
            return null;
        } catch (error) {
            console.error('Error fetching shop session:', error);
            return null;
        }
    }

    getLocales = async (themeId) => {
        const themeAssets = await this.getThemeAssets(themeId);

        if (!themeAssets || themeAssets.length === 0) {
            return [];
        }

        return themeAssets
            .filter(file => file.key.includes('locales/') && !file.key.includes('.schema.'))
            .map(file => {
                const key = file.key.replace(/^locales\/([a-zA-Z0-9\-]+)\.(.*)$/, '$1');
                const isDefault = /\.default\./.test(file.key);
                return {
                    key: key,
                    name: key,
                    default: isDefault
                };
            });
    }

    getThemeAssets = async (themeId = null) => {
        if (themeId) {
            const response = await shopify.rest.Asset.all({
                session: await this.getShopSession(),
                theme_id: themeId
            })
            return response?.data || [];
        }

        return null;
    }

    getInfoShop = async () => {
        const response = await shopify.rest.Shop.all({
            session: await this.getShopSession()
        })
        return response?.data?.[0] || null;
    }
}
