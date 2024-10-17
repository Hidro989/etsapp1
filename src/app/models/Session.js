import mongoose from "mongoose";
const sessionSchema = new mongoose.Schema({
    session_id: { type: String, maxLength: 191 },
    shop: { type: String },
    is_online: { type: Boolean },
    state: { type: String },
    scope: { type: String },
    access_token: { type: String },
    expires_at: { type: Date },
    user_id: { type: String },
    user_first_name: { type: String },
    user_last_name: { type: String },
    user_email: { type: String },
    user_email_verified: { type: String },
    account_owner: { type: String },
    locale: { type: String },
    collaborator: { type: Boolean },
    online_access_info: { type: String },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() }
}, {
    versionKey: false
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;