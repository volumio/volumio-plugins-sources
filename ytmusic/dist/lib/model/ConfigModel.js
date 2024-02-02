"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ConfigModel_instances, _ConfigModel_fetchSettingsPage, _ConfigModel_getCategoryFromSettingsPageResponse, _ConfigModel_getDefaultI18nOptions;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_CONFIG_SCHEMA = void 0;
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const YTMusicContext_1 = __importDefault(require("../YTMusicContext"));
const BaseModel_1 = require("./BaseModel");
const CATEGORY_IDS = {
    'i18n': 'SETTING_CAT_I18N'
};
const OPTION_IDS = {
    'region': 'I18N_REGION',
    'language': 'I18N_LANGUAGE'
};
exports.PLUGIN_CONFIG_SCHEMA = {
    region: { defaultValue: 'US', json: false },
    language: { defaultValue: 'en', json: false },
    loadFullPlaylists: { defaultValue: false, json: false },
    autoplay: { defaultValue: false, json: false },
    autoplayClearQueue: { defaultValue: false, json: false },
    addToHistory: { defaultValue: true, json: false },
    prefetch: { defaultValue: true, json: false },
    preferOpus: { defaultValue: false, json: false },
    authCredentials: { defaultValue: undefined, json: true }
};
class ConfigModel extends BaseModel_1.BaseModel {
    constructor() {
        super(...arguments);
        _ConfigModel_instances.add(this);
    }
    async getI18nOptions() {
        const cached = YTMusicContext_1.default.get('configI18nOptions');
        if (cached) {
            return cached;
        }
        const response = await __classPrivateFieldGet(this, _ConfigModel_instances, "m", _ConfigModel_fetchSettingsPage).call(this);
        const settings = __classPrivateFieldGet(this, _ConfigModel_instances, "m", _ConfigModel_getCategoryFromSettingsPageResponse).call(this, 'i18n', response);
        if (Array.isArray(settings?.items)) {
            const tmpResult = settings.items.reduce((result, item) => {
                const optionId = item.settingSingleOptionMenuRenderer?.itemId;
                let key;
                switch (optionId) {
                    case OPTION_IDS['region']:
                        key = 'region';
                        break;
                    case OPTION_IDS['language']:
                        key = 'language';
                        break;
                    default:
                        key = null;
                }
                if (key) {
                    const label = new volumio_youtubei_js_1.Misc.Text(item.settingSingleOptionMenuRenderer.title).text;
                    let optionValues = null;
                    if (Array.isArray(item.settingSingleOptionMenuRenderer.items)) {
                        optionValues = item.settingSingleOptionMenuRenderer.items.reduce((result, item) => {
                            const label = item.settingMenuItemRenderer?.name;
                            const value = item.settingMenuItemRenderer?.value;
                            if (label && value) {
                                result.push({ label, value });
                            }
                            return result;
                        }, []);
                    }
                    if (label && optionValues && optionValues.length > 0) {
                        result[key] = { label, optionValues };
                    }
                }
                return result;
            }, {});
            const defaultI18nOptions = __classPrivateFieldGet(this, _ConfigModel_instances, "m", _ConfigModel_getDefaultI18nOptions).call(this);
            const result = {
                region: tmpResult.region || defaultI18nOptions.region,
                language: tmpResult.language || defaultI18nOptions.language
            };
            if (tmpResult.region && tmpResult.language) {
                YTMusicContext_1.default.set('configI18nOptions', result);
            }
            return result;
        }
        return { ...__classPrivateFieldGet(this, _ConfigModel_instances, "m", _ConfigModel_getDefaultI18nOptions).call(this) };
    }
    clearCache() {
        YTMusicContext_1.default.set('configI18nOptions', null);
    }
}
exports.default = ConfigModel;
_ConfigModel_instances = new WeakSet(), _ConfigModel_fetchSettingsPage = async function _ConfigModel_fetchSettingsPage() {
    const { innertube } = await this.getInnertube();
    const requestData = {
        client: 'YTMUSIC'
    };
    try {
        const response = await innertube.session.http.fetch('/account/get_setting', {
            method: 'POST',
            body: JSON.stringify(requestData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(await response.text());
    }
    catch (error) {
        YTMusicContext_1.default.getLogger().error(YTMusicContext_1.default.getErrorMessage('[ytmusic] Error in ConfigModel._fetchSettingsPage(): ', error));
        return null;
    }
}, _ConfigModel_getCategoryFromSettingsPageResponse = function _ConfigModel_getCategoryFromSettingsPageResponse(categoryName, response) {
    const categoryId = CATEGORY_IDS[categoryName];
    if (categoryId) {
        return response?.items?.find((item) => item.settingCategoryCollectionRenderer?.categoryId === categoryId).settingCategoryCollectionRenderer || null;
    }
    return null;
}, _ConfigModel_getDefaultI18nOptions = function _ConfigModel_getDefaultI18nOptions() {
    return {
        region: {
            label: YTMusicContext_1.default.getI18n('YTMUSIC_REGION'),
            optionValues: [
                { label: 'United States', value: 'US' }
            ]
        },
        language: {
            label: YTMusicContext_1.default.getI18n('YTMUSIC_LANGUAGE'),
            optionValues: [
                { label: 'English (US)', value: 'en' }
            ]
        }
    };
};
//# sourceMappingURL=ConfigModel.js.map