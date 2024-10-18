import User from "../models/User.js";
import Plan from "../models/Plan.js";
import {UserService} from "../services/UserService.js";
import Charge from "../models/Charge.js";
import {PLAN_CONSTANTS} from "../../configs/constants.js";
import {Database} from "../../configs/database.js";
import shopify from "../../configs/shopify.js";
import createError from "http-errors";

export default class EmbedBillingController {
    callback = async (req, res, next) => {
        try {
            await Database.connect();
            let user = await User.findOne({name: req.query.shop});
            const plan = await Plan.findById(req.query.plan);
            const charge_id = req.query.charge_id;

            if (user && plan && charge_id) {
                const userService = new UserService(user)
                user = await userService.resetStorageData();
                user.plan_id = plan._id;
                user.shopify_freemium = plan.ref === PLAN_CONSTANTS.REF_FREEMIUM;
                await user.save();

                const charge = new Charge();
                charge.plan_id = plan._id;
                charge.user_id = user._id;
                charge.charge_id = charge_id;
                charge.type = plan.type;
                charge.status = 'ACTIVE';
                charge.name = plan.name;
                charge.price = plan.price;
                charge.interval = plan.interval;
                charge.test = plan.test;
                charge.trial_days = plan.trial_days;
                charge.capped_amount = plan.capped_amount;
                charge.terms = plan.terms;
                await charge.save();

                res.redirect(shopify.auth.buildEmbeddedAppUrl(req.query.host));
            }
        } catch (error) {
            console.error('Error during authentication:', error.message);
            return next(createError(500, 'Internal Server Error'));
        } finally {
            try {
                await Database.disconnect();
            } catch (disconnectError) {
                console.error('Error disconnecting MongoDB:', disconnectError.message);
            }
        }
    }
}