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

export default class AuthController {
  begin = async (req, res) => {
    const shop = req.query.shop;
    if (!shop || !shopify.utils.sanitizeShop(shop)) {
      return res.status(400).send("Shop domain is invalid");
    }

    return redirectToAuth(req, res, shopify);
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
          'Response headers have already been sent, skipping redirection to host',
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
            host,
          )}`;

      console.log(`Redirecting to host at ${redirectUrl}`, {
        shop: res.locals.shopify.session.shop,
      });

      res.redirect(redirectUrl);
  }
}
