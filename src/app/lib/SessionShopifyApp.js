import {Session as SessionShopify} from '@shopify/shopify-api';
import Session from '../models/Session.js'

export class SessionShopifyApp {
    static storeSession = async (session) => {
        try {
            const filter = { session_id: session.id };
            const replacement = {
                session_id: session.id,
                shop: session.shop,
                is_online: session.isOnline,
                state: session.state,
                scope: session.scope,
                access_token: session.accessToken,
                expires_at: session.expires ?? null,
                online_access_info: session.onlineAccessInfo ?? null,
            };
            
            const options = { upsert: true, new: true };
            const dbSession = await Session.findOneAndReplace(filter, replacement, options);
            
            return dbSession;
        } catch (error) {
            console.error('Error storing session');
            return false;
        }
    }

    static loadSession = async (sessionId) => {
        const dbSession = await Session.findOne({ session_id: sessionId });
        if (dbSession) {
            return new SessionShopify({
                id: dbSession.session_id,
                shop: dbSession.shop,
                state: dbSession.state,
                scope: dbSession.scope,
                accessToken: dbSession.access_token,
                expires: dbSession.expires_at,
                isOnline: dbSession.is_online,
                onlineAccessInfo: dbSession.online_access_info
            });
        }
        return null;
    }
}