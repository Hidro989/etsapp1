import shopify from "../../configs/shopify.js";

export async function cspHeaders( req, res, next) {
  addCSPHeader(req, res);
  next();
}

export function addCSPHeader( req, res) {
  const shop = shopify.utils.sanitizeShop(req.query.shop);
  if (shopify.isEmbeddedApp && shop) {
    res.setHeader(
      "Content-Security-Policy",
      `frame-ancestors https://${encodeURIComponent(
        shop
      )} https://admin.shopify.com https://*.spin.dev;`
    );
  } else {
    res.setHeader("Content-Security-Policy", `frame-ancestors 'none';`);
  }
}
