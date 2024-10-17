import shopify from "../../configs/shopify.js";

export const removeProtocol = (url) => {
    if (typeof url !== 'string') {
        return '';
    }
    return url.replace(/^https?:\/\//, '');
}

export const getShopifyScopes = (scopes) => {
    return scopes.split(',').map(scope => scope.trim())
}

export const buildAuthUrl = (shop) => {
    const { SHOPIFY_API_KEY, APP_URL, SHOPIFY_SCOPES } = process.env;
    const redirectUri = `${APP_URL}/api/auth/callback`;
    const state = shopify.auth.nonce();
    return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
};

const buildEmbeddedAppUrl = (host) => {
    const decodedHost = atob(host);
    return `https://${decodedHost}/apps/${shopify.config.apiKey}`;
};

