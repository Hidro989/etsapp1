import { CookieNotFound, ShopifyError } from "@shopify/shopify-api";
import shopify from "../../configs/shopify.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { PlanService } from "../services/PlanService.js";
import { PLAN_CONSTANTS } from "../../configs/constants.js";
import { EnsureBillingService } from "../services/EnsureBillingService.js";
import { UserService } from "../services/UserService.js";
import { WebhookService } from "../services/WebhookService.js";
import { redirectToAuth } from "../lib/redirectToAuth.js";
import { authCallback } from "../lib/authCallback.js";
import { validateAuthenticatedSession } from "../lib/validateAuthenticatedSession.js";
import { SessionShopifyApp } from "../lib/SessionShopifyApp.js";
import { addCSPHeader } from "../lib/cspHeader.js";
import { hasValidAccessToken } from "../lib/hasValidAccessToken.js";

export default class AuthController {
  begin = async (req, res) => {
    const shop = req.query.shop;
    if (!shop || !shopify.utils.sanitizeShop(shop)) {
      return res.status(400).send("Shop domain is invalid");
    }

    return redirectToAuth(req, res);
  };

  callback = async (req, res, next) => {
    const oauthCompleted = await authCallback(req, res, shopify);
    if (oauthCompleted) {
      next();
    }
  };

  redirectToShopifyOrAppRoot = async (req, res) => {
    if (res.headersSent) {
      console.log(
        "Response headers have already been sent, skipping redirection to host"
      );
      return;
    }

    const host = shopify.utils.sanitizeHost(req.query.host);
    const redirectUrl = shopify.config.isEmbeddedApp
      ? await shopify.auth.getEmbeddedAppUrl({
          rawRequest: req,
          rawResponse: res,
        })
      : `/?shop=${res.locals.shopify.session.shop}&host=${encodeURIComponent(
          host
        )}`;

    console.log(`Redirecting to host at ${redirectUrl}`, {
      shop: res.locals.shopify.session.shop,
    });

    res.redirect(redirectUrl);
  };

  ensureInstalledOnShop = async (req, res, next) => {
    if (shopify.config.isEmbeddedApp) {
      return validateAuthenticatedSession( req, res, next);
    }

    const shop = getRequestShop(shopify, req, res);
    if (!shop) {
      return undefined;
    }

    console.debug("Checking if shop has installed the app", { shop });

    const sessionId = shopify.session.getOfflineId(shop);
    const session = await SessionShopifyApp.loadSession(sessionId);

    const exitIframeRE = new RegExp(`^ExitIframe`, "i");

    if (!session && !req.originalUrl.match(exitIframeRE)) {
      console.debug(
        "App installation was not found for shop, redirecting to auth",
        { shop }
      );

      return redirectToAuth(req, res);
    }

    if (shopify.config.isEmbeddedApp && req.query.embedded !== '1') {
      if (await sessionHasValidAccessToken(shopify, config, session)) {
        await embedAppIntoShopify(shopify, req, res, shop);
        return undefined;
      } else {
        console.info(
          'Found a session, but it is not valid. Redirecting to auth',
          {shop},
        );

        return redirectToAuth(req, res);
      }
    }

    addCSPHeader( req, res);
    console.info("App is installed and ready to load", { shop });

    return next();
  };
}


async function getRequestShop(shopify, req, res) {
  if (typeof req.query.shop !== "string") {
    console.error(
      "ensureInstalledOnShop did not receive a shop query argument",
      { shop: req.query.shop }
    );

    res.status(400);
    res.send("No shop provided");
    return undefined;
  }

  const shop = shopify.utils.sanitizeShop(req.query.shop);

  if (!shop) {
    console.error(
      "ensureInstalledOnShop did not receive a valid shop query argument",
      { shop: req.query.shop }
    );

    res.status(422);
    res.send("Invalid shop provided");
    return undefined;
  }

  return shop;
}

const sessionHasValidAccessToken = async (shopify, session) => {
  if (!session) {
    return false;
  }

  try {
    return (
      session.isActive(shopify.scopes) &&
      (await hasValidAccessToken(shopify, session))
    );
  } catch (error) {
    config.logger.error(`Could not check if session was valid: ${error}`, {
      shop: session.shop,
    });
    return false;
  }
}

async function embedAppIntoShopify(shopify, req, res, shop) {
  let embeddedUrl;
  try {
    embeddedUrl = await shopify.auth.getEmbeddedAppUrl({
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error(
      `ensureInstalledOnShop did not receive a host query argument`,
      { shop }
    );

    res.status(400);
    res.send('No host provided');
    return;
  }

  console.debug(
    `Request is not embedded but app is. Redirecting to ${embeddedUrl} to embed the app`,
    { shop }
  );

  res.redirect(embeddedUrl + req.path);
}

