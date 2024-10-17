import Plan from '../models/Plan.js';
import mongoose from "mongoose";

export class PlanService {
    getPlans = async (active = true, addCurrentPlanUser = false, user = null) => {
        try {
            const query = {
                $or: [
                    { is_private: { $exists: false } },
                    { is_private: 0 }
                ]
            };
            if (active) {
                query.active = 1;
            }
            let plansQuery = Plan.find(query).sort({ sort_order: 1 });
            if (addCurrentPlanUser && (user && user._id)) {
                plansQuery = plansQuery.or([{ _id: mongoose.Types.ObjectId(user._id) }]);
            }
            return await plansQuery.exec();
        } catch (error) {
            console.error('Error fetching plans:', error);
            throw new Error('Error fetching plans');
        }
    }
}