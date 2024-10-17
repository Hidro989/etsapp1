import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, maxLength: 191 },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    is_installed: { type: Boolean, default: false },
    info_shop: { type: Object },
    theme_id: { type: String },
    version: { type: String },
    mail_limited_email_at: { type: String },
    mail_limited_smtp_at: { type: String },
    mail_gtl_email_at: { type: String },
    mail_gtl_smtp_at: { type: String },
    mail_gtl_storage_at: { type: String },
    mail_limited_storage_at: { type: String },
    plan_id: { type: String },
    shopify_freemium: { type: Boolean },
    locales: { type: Array },
    login_token: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    versionKey: false
});

userSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
