import {ApiService} from './ApiService.js';

export class UserService {

    constructor(user) {
        this.user = user;
        this.api = new ApiService(user.name);
    }

    installApp = async (addScriptTags = true, updateThemeId = true, isGenerateApp = false, plan_id = null, useFreePlan = false) => {
        this.user.is_installed = 1;
        this.user.version = process.env.APP_VERSION || '1.0.5';
        const themeId = updateThemeId ? await this.api.getIdThemeActive() : null;

        if (!isGenerateApp) {
            await TranslationService.initTranslate(this.user._id);
            await MessageTagService.addDefaultMessageTag(this.user._id);
        }

        if (themeId) {
            this.user.locales = await this.api.getLocales(themeId);
        }

        if (!isGenerateApp) {
            this.user = await this.resetStorageData();
            this.user.info_shop = await this.api.getInfoShop();
            this.user.login_token = Math.random().toString(36).substring(2, 12);
            await ContactFormSettingService.addDefaultSetting(this.user);
        }

        if (plan_id) {
            this.user.plan_id = plan_id;
            this.user.shopify_freemium = useFreePlan;
        }

        await this.user.save();
    }

    resetStorageData = async () => {
        this.user.mail_limited_email_at = null;
        this.user.mail_limited_smtp_at = null;
        this.user.mail_gtl_email_at = null;
        this.user.mail_gtl_smtp_at = null;
        this.user.mail_gtl_storage_at = null;
        this.user.mail_limited_storage_at = null;

        return await this.user.save();
    }
}