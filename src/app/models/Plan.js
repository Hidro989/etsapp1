import mongoose from "mongoose";
const planSchema = new mongoose.Schema({
    type: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    display_price: { type: Number, default: 0 },
    interval: { type: String, required: true },
    capped_amount: { type: Number, default: 0 },
    terms: { type: String, default: null },
    trial_days: { type: Number, default: 0 },
    test: { type: Boolean, default: false },
    on_install: { type: Number, default: 0 },
    feature_text: { type: String, default: '' },
    only_new_user: { type: Boolean, default: true },
    time_accept_plan: { type: Date, required: true },
    limit_form_type: { type: Number, default: 1 },
    limit_email_integration: { type: Number, default: 0 },
    limit_message_tags: { type: Number, default: 0 },
    ref: { type: String, default: 'STANDARD' },
    nb_form_limit: { type: String, default: '' },
    enable_reply_message: { type: Boolean, default: true },
    sub_description: { type: String, default: null },
    description: { type: String, default: null },
    active: { type: Number, default: 1 },
    is_private: { type: Number, default: 0 },
    sort_order: { type: Number, default: 1 },
    nb_mail_limit: { type: String, default: '' },
    nb_smtp_limit: { type: String, default: '' },
    limit_multiple_languages: { type: String, default: '' },
    nb_storage_limit: { type: String, default: '3' },
    nb_email_app_in_hour: { type: String, default: '' },
    nb_email_custom_in_hour: { type: String, default: '' },
    updated_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
}, {
    versionKey: false
});
const Plan = mongoose.model('Plan', planSchema, 'plans');

export default Plan;