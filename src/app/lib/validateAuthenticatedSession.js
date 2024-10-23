import { InvalidJwtError } from "@shopify/shopify-api";
import { redirectToAuth } from "./redirectToAuth.js";
import { redirectOutOfApp } from "./redirectOutOfApp.js";
import { SessionShopifyApp } from "../lib/SessionShopifyApp.js";
import {hasValidAccessToken} from "../lib/hasValidAccessToken.js";
import shopify from "../../configs/shopify.js";


export async function validateAuthenticatedSession(req, res, next) {
  let sessionId;
  try {
    sessionId = await shopify.session.getCurrentId({
      isOnline: shopify.config.useOnlineTokens,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error(`Error when loading session from storage: ${error}`);    
    handleSessionError(req, res, error);
    return undefined;
  }

  let session;
  if (sessionId) {
    try {
      session = await SessionShopifyApp.loadSession(sessionId);
    } catch (error) {
      console.error(`Error when loading session from storage: ${error}`);

      res.status(500);
      res.send(error.message);
      return undefined;
    }
  }

  let shop = shopify.utils.sanitizeShop(req.query.shop) || session?.shop;

  if (session && shop && session.shop !== shop) {
    console.debug("Found a session for a different shop in the request", {
      currentShop: session.shop,
      requestShop: shop,
    });

    return redirectToAuth(req, res);
  }

  if (session) {
    console.debug("Request session found and loaded", {
      shop: session.shop,
    });

    if (session.isActive(shopify.scopes)) {
      console.debug("Request session exists and is active", {
        shop: session.shop,
      });

      if (await hasValidAccessToken(shopify, session)) {
        console.debug("Request session has a valid access token", {
          shop: session.shop,
        });

        res.locals.shopify = {
          ...res.locals.shopify,
          session,
        };
        return next();
      }
    }

    const bearerPresent = req.headers.authorization?.match(/Bearer (.*)/);
    if (bearerPresent) {
      if (!shop) {
        shop = await setShopFromSessionOrToken(
          shopify,
          session,
          bearerPresent[1]
        );
      }
    }

    const redirectUri = `${process.env.SHOPIFY_API_REDIRECT_URI}?shop=${shop}`;
    console.info(`Session was not valid. Redirecting to ${redirectUri}`, {
      shop,
    });

    return redirectOutOfApp(req, res, redirectUri, shop);
  }
}

function handleSessionError(_req, res, error) {
  switch (true) {
    case error instanceof InvalidJwtError:
      res.status(401);
      res.send(error.message);
      break;
    default:
      res.status(500);
      res.send(error.message);
      break;
  }
}

async function setShopFromSessionOrToken(shopify, session, token) {
  let shop;

  if (session) {
    shop = session.shop;
  } else if (api.config.isEmbeddedApp) {
    const payload = await shopify.session.decodeSessionToken(token);
    shop = payload.dest.replace("https://", "");
  }
  return shop;
}
