import { redirectOutOfApp } from "./redirectOutOfApp.js";

export async function redirectToAuth(req, res, shopify, isOnline = false) {
  const shop = shopify.utils.sanitizeShop(req.query.shop);
  if (!shop) {
    res.status(500);
    res.send("No shop provided");
    return;
  }

  if (req.query.embedded === '1') {
    clientSideRedirect(req, res, shopify, shop);
  } else {
    await serverSideRedirect(req, res, shopify, shop, isOnline);
  }
}

function clientSideRedirect(req, res, shopify, shop) {
    const host = shopify.utils.sanitizeHost(req.query.host);
    if (!host) {
        res.status(500);
        res.send('No host provided');
        return;
    }

    const redirectUriParams = new URLSearchParams({shop, host}).toString();
    const redirectUri = `${shopify.config.hostScheme}://${shopify.config.hostName}/auth?${redirectUriParams}`;

    redirectOutOfApp({req, res, redirectUri, shop});
}

async function serverSideRedirect(req, res, shopify, shop, isOnline) {
    await shopify.auth.begin({
        callbackPath: '/etsapp1/api/auth/callback',
        shop,
        isOnline,
        rawRequest: req,
        rawResponse: res,
      });
}
