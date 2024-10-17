import shopify from "../../configs/shopify.js";

export function redirectOutOfApp({req, res, redirectUri, shop}) {
    if (
        (!shopify.config.isEmbeddedApp && isFetchRequest(req)) ||
        req.headers.authorization?.match(/Bearer (.*)/)
      ) {
        appBridgeHeaderRedirect(res, redirectUri);
      } else if (req.query.embedded === '1') {
        exitIframeRedirect(req, res, redirectUri, shop);
      } else {
        serverSideRedirect(res, redirectUri);
      }
}

function appBridgeHeaderRedirect(res, redirectUri) {
    res.status(403);
    res.append('Access-Control-Expose-Headers', [
      'X-Shopify-Api-Request-Failure-Reauthorize',
      'X-Shopify-Api-Request-Failure-Reauthorize-Url',
    ]);
    res.header('X-Shopify-API-Request-Failure-Reauthorize', '1');
    res.header('X-Shopify-API-Request-Failure-Reauthorize-Url', redirectUri);
    res.end();
}

function exitIframeRedirect(req, res, redirectUri, shop) {
    const queryParams = new URLSearchParams({
        ...req.query,
        shop,
        redirectUri,
      }).toString();
    
      res.redirect(`ExitIframe?${queryParams}`);
}

function serverSideRedirect(res, redirectUri) {
    res.redirect(redirectUri);
}

function isFetchRequest(req){
    return req.xhr || req.headers['sec-fetch-dest'] === 'empty';
}