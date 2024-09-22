"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ConfigModel_instances, _ConfigModel_fetchAccountMenu, _ConfigModel_getDefaultI18nOptions;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_CONFIG_SCHEMA = void 0;
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
const util_1 = require("../util");
const BaseModel_1 = require("./BaseModel");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
exports.PLUGIN_CONFIG_SCHEMA = {
    region: { defaultValue: 'US', json: false },
    language: { defaultValue: 'en', json: false },
    rootContentType: { defaultValue: 'full', json: false },
    loadFullPlaylists: { defaultValue: false, json: false },
    autoplay: { defaultValue: false, json: false },
    autoplayClearQueue: { defaultValue: false, json: false },
    autoplayPrefMixRelated: { defaultValue: false, json: false },
    addToHistory: { defaultValue: true, json: false },
    liveStreamQuality: { defaultValue: 'auto', json: false },
    prefetch: { defaultValue: true, json: false },
    ytPlaybackMode: { defaultValue: {
            feedVideos: true,
            playlistVideos: false
        }, json: true },
    authCredentials: { defaultValue: undefined, json: true }
};
class ConfigModel extends BaseModel_1.BaseModel {
    constructor() {
        super(...arguments);
        _ConfigModel_instances.add(this);
    }
    async getI18nOptions() {
        const cached = YouTube2Context_1.default.get('configI18nOptions');
        if (cached) {
            return cached;
        }
        const __createPredicate = (targetSelectCommandKey, targetCodeProp) => {
            return (key, value) => {
                // Match is true if:
                // 1. property is identified by `key` = 'multiPageMenuRenderer'; and
                // 2. somewhere in the nested properties of `value`, there exists `targetSelectCommandKey` which itself has the property `targetCodeProp`
                // We use a second predicate for testing condition 2.
                const secondaryPredicate = (k, v) => {
                    return (k === targetSelectCommandKey && v[targetCodeProp]);
                };
                return key === 'multiPageMenuRenderer' && (0, util_1.findInObject)(value, secondaryPredicate).length > 0;
            };
        };
        const __parseMenu = (contents, targetSelectCommandKey, targetCodeProp) => {
            const header = volumio_youtubei_js_1.Parser.parseItem(contents.header);
            let label = null;
            if (header?.hasKey('title')) {
                label = InnertubeResultParser_1.default.unwrap(header.title);
            }
            const menuItems = (0, util_1.findInObject)(contents, (key, value) => {
                return key === 'compactLinkRenderer' && value.serviceEndpoint?.signalServiceEndpoint?.actions?.find((action) => action[targetSelectCommandKey]);
            });
            const optionValues = menuItems.reduce((ov, item) => {
                const label = InnertubeResultParser_1.default.unwrap(new volumio_youtubei_js_1.Misc.Text(item.title));
                const value = new volumio_youtubei_js_1.YTNodes.NavigationEndpoint(item.serviceEndpoint)?.payload?.actions?.find((action) => action[targetSelectCommandKey])?.[targetSelectCommandKey]?.[targetCodeProp];
                if (label && value) {
                    ov.push({ label, value });
                }
                return ov;
            }, []);
            if (optionValues.length > 0) {
                return {
                    label,
                    optionValues
                };
            }
            return null;
        };
        let noCache = false;
        const contents = await __classPrivateFieldGet(this, _ConfigModel_instances, "m", _ConfigModel_fetchAccountMenu).call(this);
        const languageMenu = (0, util_1.findInObject)(contents, __createPredicate('selectLanguageCommand', 'hl'))?.[0];
        const regionMenu = (0, util_1.findInObject)(contents, __createPredicate('selectCountryCommand', 'gl'))?.[0];
        const defualtI18nOptions = __classPrivateFieldGet(this, _ConfigModel_instances, "m", _ConfigModel_getDefaultI18nOptions).call(this);
        const results = {};
        if (languageMenu) {
            const languageOption = __parseMenu(languageMenu, 'selectLanguageCommand', 'hl');
            if (languageOption) {
                results.language = {
                    label: languageOption.label || defualtI18nOptions.language.label,
                    optionValues: languageOption.optionValues
                };
            }
        }
        if (regionMenu) {
            const regionOption = __parseMenu(regionMenu, 'selectCountryCommand', 'gl');
            if (regionOption) {
                results.region = {
                    label: regionOption.label || defualtI18nOptions.region.label,
                    optionValues: regionOption.optionValues
                };
            }
        }
        if (!results.language) {
            results.language = defualtI18nOptions.language;
            noCache = true;
        }
        if (!results.region) {
            results.region = defualtI18nOptions.region;
            noCache = true;
        }
        if (!noCache) {
            YouTube2Context_1.default.set('configI18nOptions', results);
        }
        return results;
    }
    clearCache() {
        YouTube2Context_1.default.set('configI18nOptions', null);
    }
    getRootContentTypeOptions() {
        return [
            {
                'label': YouTube2Context_1.default.getI18n('YOUTUBE2_SIMPLE'),
                'value': 'simple'
            },
            {
                'label': YouTube2Context_1.default.getI18n('YOUTUBE2_FULL'),
                'value': 'full'
            }
        ];
    }
    getLiveStreamQualityOptions() {
        return [
            {
                'label': YouTube2Context_1.default.getI18n('YOUTUBE2_AUTO'),
                'value': 'auto'
            },
            {
                'label': '144p',
                'value': '144p'
            },
            {
                'label': '240p',
                'value': '240p'
            },
            {
                'label': '360p',
                'value': '360p'
            },
            {
                'label': '480p',
                'value': '480p'
            },
            {
                'label': '720p',
                'value': '720p'
            },
            {
                'label': '1080p',
                'value': '1080p'
            }
        ];
    }
}
exports.default = ConfigModel;
_ConfigModel_instances = new WeakSet(), _ConfigModel_fetchAccountMenu = async function _ConfigModel_fetchAccountMenu() {
    const { innertube } = await this.getInnertube();
    const requestData = {
        client: 'WEB'
    };
    try {
        const response = await innertube.session.http.fetch('/account/account_menu', {
            method: 'POST',
            body: JSON.stringify(requestData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(await response.text());
    }
    catch (error) {
        YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage('[youtube2] Error in ConfigModel.#fetchAccountMenu(): ', error));
        return null;
    }
}, _ConfigModel_getDefaultI18nOptions = function _ConfigModel_getDefaultI18nOptions() {
    return {
        region: {
            label: YouTube2Context_1.default.getI18n('YOUTUBE2_REGION'),
            optionValues: [
                { label: 'United States', value: 'US' }
            ]
        },
        language: {
            label: YouTube2Context_1.default.getI18n('YOUTUBE2_LANGUAGE'),
            optionValues: [
                { label: 'English (US)', value: 'en' }
            ]
        }
    };
};
//# sourceMappingURL=ConfigModel.js.map