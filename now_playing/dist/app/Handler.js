"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.font = exports.api = exports.myBackground = exports.preview = exports.index = void 0;
const ejs_1 = __importDefault(require("ejs"));
const fs_1 = __importDefault(require("fs"));
const NowPlayingContext_1 = __importDefault(require("../lib/NowPlayingContext"));
const System_1 = require("../lib/utils/System");
const MetadataAPI_1 = __importDefault(require("../lib/api/MetadataAPI"));
const SettingsAPI_1 = __importDefault(require("../lib/api/SettingsAPI"));
const WeatherAPI_1 = __importDefault(require("../lib/api/WeatherAPI"));
const UnsplashAPI_1 = __importDefault(require("../lib/api/UnsplashAPI"));
const CommonSettingsLoader_1 = __importDefault(require("../lib/config/CommonSettingsLoader"));
const now_playing_common_1 = require("now-playing-common");
const MyBackgroundMonitor_1 = __importDefault(require("../lib/utils/MyBackgroundMonitor"));
const Misc_1 = require("../lib/utils/Misc");
const SystemUtils = __importStar(require("../lib/utils/System"));
const FontHelper_1 = require("../lib/utils/FontHelper");
const APIs = {
    metadata: MetadataAPI_1.default,
    settings: SettingsAPI_1.default,
    weather: WeatherAPI_1.default,
    unsplash: UnsplashAPI_1.default
};
async function index(req, res) {
    const html = await renderView('index', req, {
        settings: {
            [now_playing_common_1.CommonSettingsCategory.Startup]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Startup),
            [now_playing_common_1.CommonSettingsCategory.ContentRegion]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.ContentRegion),
            [now_playing_common_1.CommonSettingsCategory.NowPlayingScreen]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.NowPlayingScreen),
            [now_playing_common_1.CommonSettingsCategory.IdleScreen]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.IdleScreen),
            [now_playing_common_1.CommonSettingsCategory.Background]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Background),
            [now_playing_common_1.CommonSettingsCategory.ActionPanel]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.ActionPanel),
            [now_playing_common_1.CommonSettingsCategory.Theme]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Theme),
            [now_playing_common_1.CommonSettingsCategory.Performance]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Performance),
            [now_playing_common_1.CommonSettingsCategory.Localization]: CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Localization)
        }
    });
    res.send(html);
}
exports.index = index;
async function preview(req, res) {
    const html = await renderView('preview', req, {
        nowPlayingUrl: getNowPlayingURL(req)
    });
    res.send(html);
}
exports.preview = preview;
async function myBackground(params, res) {
    const images = MyBackgroundMonitor_1.default.getImages();
    if (images.length === 0) {
        NowPlayingContext_1.default.getLogger().error('[now-playing] No images found in My Backgrounds');
        res.send(404);
        return;
    }
    let targetImage;
    const { file } = params;
    if (file) {
        targetImage = images.find((img) => img.name === file);
        if (!targetImage) {
            NowPlayingContext_1.default.getLogger().error(`[now-playing] Image '${file}' not found in My Backgrounds`);
            res.send(404);
            return;
        }
    }
    else {
        const rndIndex = (0, Misc_1.rnd)(0, images.length);
        targetImage = images[rndIndex];
        NowPlayingContext_1.default.getLogger().info(`[now-playing] Random My Background image: '${targetImage.name}'`);
    }
    if (!SystemUtils.fileExists(targetImage.path)) {
        NowPlayingContext_1.default.getLogger().error(`[now-playing] Path to My Background image '${targetImage.path}' not found`);
        res.send(404);
        return;
    }
    try {
        fs_1.default.createReadStream(targetImage.path).pipe(res);
    }
    catch (error) {
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] Error piping ${targetImage.path} to response`, error, true));
        res.send(400);
    }
}
exports.myBackground = myBackground;
async function api(apiName, method, params, res) {
    const api = apiName && method ? APIs[apiName] : null;
    const fn = api && typeof api[method] === 'function' ? api[method] : null;
    if (fn) {
        try {
            const result = await fn.call(api, params);
            res.json({
                success: true,
                data: result
            });
        }
        catch (e) {
            NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] API endpoint ${apiName}/${method} returned error:`, e, true));
            res.json({
                success: false,
                error: e.message || e
            });
        }
    }
    else {
        res.json({
            success: false,
            error: `Invalid API endpoint ${apiName}/${method}`
        });
    }
}
exports.api = api;
async function font(filename, res) {
    const assetPath = `${FontHelper_1.FONT_DIR}/${filename}`;
    if (!SystemUtils.fileExists(assetPath)) {
        return res.send(404);
    }
    try {
        fs_1.default.createReadStream(assetPath).pipe(res);
    }
    catch (error) {
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] Error piping ${assetPath} to response`, error, true));
        return res.send(400);
    }
}
exports.font = font;
function getNowPlayingURL(req) {
    return `${req.protocol}://${req.hostname}:${NowPlayingContext_1.default.getConfigValue('port')}`;
}
function renderView(name, req, data = {}) {
    if (!data.i18n) {
        data.i18n = NowPlayingContext_1.default.getI18n.bind(NowPlayingContext_1.default);
    }
    if (!data.host) {
        data.host = `${req.protocol}://${req.hostname}:3000`;
    }
    if (!data.pluginInfo) {
        data.pluginInfo = (0, System_1.getPluginInfo)();
    }
    return new Promise((resolve, reject) => {
        ejs_1.default.renderFile(`${__dirname}/views/${name}.ejs`, data, {}, (err, str) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(str);
            }
        });
    });
}
//# sourceMappingURL=Handler.js.map