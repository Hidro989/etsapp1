import mongoose from "mongoose";
const schema = new mongoose.Schema({
    plan_id: {type: String, required: true},
    user_id: {type: String, required: true},
    charge_id: {type: String, required: true},
    type: {type: String, required: true},
    status: {type: String, required: true},
    name: {type: String, required: true},
    price: { type: Number, required: true },
    interval: { type: String, required: true },
    test: { type: Boolean, default: false },
    trial_days: { type: Number, default: 0 },
    capped_amount: { type: Number, default: 0 },
    terms: { type: String, default: null },
    activated_on: {type: Date, default: Date.now},
    billing_on: {type: Date, default: Date.now},
    trial_ends_on: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now},
    created_at: {type: Date, default: Date.now}
}, {
    versionKey: false
});
const Charge = mongoose.model('Charge', schema, 'charges');

export default Charge;