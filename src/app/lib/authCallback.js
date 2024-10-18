import {
  BotActivityDetected,
  CookieNotFound,
  privacyTopics,
  InvalidOAuthError,
} from "@shopify/shopify-api";
import { redirectToAuth } from "./redirectToAuth.js";
import { Database } from "../../configs/database.js";
import { SessionShopifyApp } from "../lib/SessionShopifyApp.js";
import { WebhookService } from "../services/WebhookService.js";
import User from "../models/User.js";
import { UserService } from "../services/UserService.js";
import { PlanService } from "../services/PlanService.js";
import { EnsureBillingService } from "../services/EnsureBillingService.js";


export async function authCallback(req, res, shopify) {
  try {
    // await Database.connect();
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    await SessionShopifyApp.storeSession(callbackResponse.session);
    await WebhookService.register(shopify, callbackResponse.session, 'app/uninstalled');
    const user = await getOrCreateUser(callbackResponse.session.shop, callbackResponse.session);
    handlePlanAndBilling(callbackResponse.session, user)

    if (!callbackResponse.session.isOnline) {
      await registerWebhooks(shopify, callbackResponse.session);
    }

    if (shopify.useOnlineTokens && !callbackResponse.session.isOnline) {
      console.error(
        'Completing offline token OAuth, redirecting to online token OAuth',
      );

      await redirectToAuth({req, res, shopify, isOnline: true});
      return false;
    }

    res.locals.shopify = {
      ...res.locals.shopify,
      session: callbackResponse.session,
    };

    return true;
  } catch (error) {
    console.error(`Failed to complete OAuth with error: ${error}`);
    await handleCallbackError(req, res, shopify, error);
  }

  return false;
}


async function registerWebhooks(shopify, session){

const responsesByTopic = await shopify.webhooks.register({session});

  for (const topic in responsesByTopic) {
    if (!Object.prototype.hasOwnProperty.call(responsesByTopic, topic)) {
      continue;
    }

    for (const response of responsesByTopic[topic]) {
      if (!response.success && !privacyTopics.includes(topic)) {
        const result = response.result;

        if (result.errors) {
          console.error( `Failed to register ${topic} webhook: ${result.errors[0].message}`,);
          
        } else {
          console.error(
            `Failed to register ${topic} webhook: ${JSON.stringify(
              result.data,
            )}`,
          );
        }
      }
    }
  }

}


async function handleCallbackError(req, res, shopify, error) {
  switch (true) {
    case error instanceof InvalidOAuthError:
      res.status(400);
      res.send(error.message);
      break;
    case error instanceof CookieNotFound:
      await redirectToAuth({req, res, shopify});
      break;
    case error instanceof BotActivityDetected:
      res.status(410);
      res.send(error.message);
      break;
    default:
      res.status(500);
      res.send(error.message);
      break;
  }
}

async function getOrCreateUser (shop, session) {
  let user = await User.findOne({ name: shop });
  if (!user) {
      user = new User({
          name: shop,
          email: `shop@${shop}`,
          shopifyAccessToken: session.accessToken,
      });
      await user.save();
  }
  return user;
}

async function handlePlanAndBilling (session, user) {
  if (user && !user.is_installed) {
      let planId = null;
      let useFreePlan = false;
      const userService = new UserService(user);
      const planServices = new PlanService();
      const plans = await planServices.getPlans();

      if (!plans) {
          useFreePlan = true;
      }
      if (plans && plans.length === 1) {
          const plan = plans[0];
          if (plan?.ref === PLAN_CONSTANTS.REF_FREEMIUM) {
              planId = plan._id;
              useFreePlan = true
          } else {
              const confirmationUrl = await handlePaidPlan(session, plan);
              if (confirmationUrl) {
                  redirectURL = confirmationUrl;
              }
          }
      }
      await userService.installApp(true, false, false, planId, useFreePlan);
  }
}

async function handlePaidPlan (session, plan) {
  const configCharge = {
      chargeName: plan.name,
      amount: plan.price,
      interval: plan.interval,
      currencyCode: "USD",
      planId: plan._id,
      checkPayment: false,
  };
  return await EnsureBillingService.check(session, configCharge);
}