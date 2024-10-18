import {HttpResponseError} from "@shopify/shopify-api";

export class WebhookService {
    static register = async (shopify, session, topic) => {
        try {
            const webhook = new shopify.rest.Webhook({ session: session });
            webhook.address = `${process.env.APP_URL}/merchant/webhook`;
            webhook.topic = topic;
            webhook.format = "json";
            await webhook.save({ update: true });

            console.log(`Webhook for topic "${topic}" registered or updated successfully!`);
            return true;
        } catch (error) {
            if (error instanceof HttpResponseError && error.response.code === 422 && error.response.body.errors?.address?.includes("for this topic has already been taken")) {
                console.log(`Webhook for topic "${topic}" already exists. No action needed.`);
                return true;
            }
            console.error(`Webhook registration failed for topic "${topic}":`, error.message);
            if (error.response?.body?.errors) {
                console.error('Error details:', JSON.stringify(error.response.body.errors, null, 2));
            }
            return false;
        }
    }
}