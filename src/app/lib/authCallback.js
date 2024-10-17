import {
    BotActivityDetected,
    CookieNotFound,
    privacyTopics,
    InvalidOAuthError,
    Session,
  } from '@shopify/shopify-api';
import { redirectToAuth } from './redirectToAuth.js';
import shopify from "../../configs/shopify.js";

export async function authCallback(req, res){
    try {
        const callbackResponse = await shopify.auth.callback({
            rawRequest: req,
            rawResponse: res,
          });
        console.log(callbackResponse);
    }catch (error) {
        console.error(`Failed to complete OAuth with error: ${error}`);
    
        // await handleCallbackError(req, res, api, config, error);
      }

    return false;
}