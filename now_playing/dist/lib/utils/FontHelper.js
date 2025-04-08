"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _FontHelper_getUIConfSelectDefaultEntry;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FONT_DIR = void 0;
const fs_1 = require("fs");
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const System_1 = require("./System");
const path_1 = __importDefault(require("path"));
exports.FONT_DIR = '/data/INTERNAL/NowPlayingPlugin/Fonts';
const FONT_EXTS = [
    '.ttf',
    '.otf',
    '.woff',
    '.woff2'
];
class FontHelper {
    static getFonts() {
        if (!(0, System_1.dirExists)(exports.FONT_DIR)) {
            NowPlayingContext_1.default.getLogger().warn(`[now-playing] Could not obtain font list: "${exports.FONT_DIR}" does not exist`);
            return [];
        }
        let files;
        try {
            files = (0, fs_1.readdirSync)(exports.FONT_DIR);
        }
        catch (error) {
            NowPlayingContext_1.default.getLogger().warn(`[now-playing] Error reading "${exports.FONT_DIR}": ${error instanceof Error ? error.message : error}`);
            return [];
        }
        return files.filter((f) => FONT_EXTS.includes(path_1.default.parse(f).ext.toLowerCase()));
    }
    static fillUIConfSelectElements(...elements) {
        const fonts = this.getFonts();
        const options = fonts.map((f) => ({ value: f, label: f }));
        for (const { el, value } of elements) {
            const selected = value ? options.find((o) => o.value === value) : null;
            el.options = [__classPrivateFieldGet(this, _a, "m", _FontHelper_getUIConfSelectDefaultEntry).call(this), ...options];
            el.value = selected ? { ...selected } : __classPrivateFieldGet(this, _a, "m", _FontHelper_getUIConfSelectDefaultEntry).call(this);
        }
    }
}
exports.default = FontHelper;
_a = FontHelper, _FontHelper_getUIConfSelectDefaultEntry = function _FontHelper_getUIConfSelectDefaultEntry() {
    return { value: '', label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') };
};
//# sourceMappingURL=FontHelper.js.map