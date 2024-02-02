"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _UIHelper_rndAlbumArt, _UIHelper_constructLinkItem;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI_STYLES = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const array_shuffle_1 = __importDefault(require("array-shuffle"));
const MixcloudContext_1 = __importDefault(require("../MixcloudContext"));
exports.UI_STYLES = {
    EXCLUSIVE: 'color: #b38536; font-size: 10px; padding-right: 8px;',
    NEXT_PAGE: 'color: #7a848e;',
    LIST_ITEM_SELECTED: 'color: #54c688; font-weight: bold;',
    TITLE_CASE: 'text-transform: capitalize;',
    DESCRIPTION: 'color: #ddd; font-size: 14px; padding-top: 12px;',
    EXCLUSIVE_DESC: 'color: #ce9a42; font-size: 14px; font-weight: bold;',
    VIEW_LINK: 'color: #ebaca0;',
    PARAMS_LIST_ITEM_NAME: 'color: #ccc; margin-right: 5px;'
};
class UIHelper {
    static getMixcloudIcon() {
        return `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/mixcloud/dist/assets/images/mixcloud-sq.png')}" style="width: 32px; height: 32px; margin-right: 8px;" />`;
    }
    static addMixcloudIconToListTitle(s) {
        if (!this.supportsEnhancedTitles()) {
            return s;
        }
        return `${this.getMixcloudIcon()}${s}`;
    }
    static addIconToListTitle(faClass, s) {
        if (!this.supportsEnhancedTitles()) {
            return s;
        }
        return `<i class="${faClass}" style="padding-right: 15px;"></i>${s}`;
    }
    static styleText(s, style) {
        return `<span${style ? ` style='${style}'` : ''}>${s}</span>`;
    }
    static wrapInDiv(s, style) {
        return `<div${style ? ` style='${style}'` : ''}>${s}</div>`;
    }
    static addTextBefore(s, textToAdd, style) {
        return this.styleText(textToAdd, style) + s;
    }
    static addExclusiveText(s) {
        return this.addTextBefore(s, MixcloudContext_1.default.getI18n('MIXCLOUD_EXCLUSIVE'), exports.UI_STYLES.EXCLUSIVE);
    }
    static getMoreText() {
        return this.styleText(MixcloudContext_1.default.getI18n('MIXCLOUD_MORE'), exports.UI_STYLES.NEXT_PAGE);
    }
    static constructListTitleWithLink(title, links, isFirstList) {
        if (!this.supportsEnhancedTitles()) {
            return title;
        }
        let html = `<div style="display: flex; width: 100%; align-items: flex-end;${isFirstList ? '' : ' margin-top: -24px;'}">
                    <div>${title}</div>
                    <div style="flex-grow: 1; text-align: right; font-size: small;">`;
        if (Array.isArray(links)) {
            links.forEach((link, index) => {
                html += __classPrivateFieldGet(this, _a, "m", _UIHelper_constructLinkItem).call(this, link);
                if (index < links.length - 1) {
                    html += '<span style="padding: 0px 5px;">|</span>';
                }
            });
        }
        else {
            html += __classPrivateFieldGet(this, _a, "m", _UIHelper_constructLinkItem).call(this, links);
        }
        html += '</div></div>';
        return html;
    }
    static constructBrowsePageLink(text, uri, icon) {
        return {
            url: '#',
            text,
            onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${uri}'}, true)`,
            icon
        };
    }
    static getRandomAlbumArtFromDir(dirname) {
        const uriPathPrefix = `music_service/mixcloud/dist/assets/images/${dirname}/`;
        const dir = path_1.default.resolve(__dirname, `../../assets/images/${dirname}`);
        if (!__classPrivateFieldGet(this, _a, "f", _UIHelper_rndAlbumArt)) {
            __classPrivateFieldSet(this, _a, {}, "f", _UIHelper_rndAlbumArt);
        }
        let rnd = __classPrivateFieldGet(this, _a, "f", _UIHelper_rndAlbumArt)[dirname];
        if (!rnd) {
            rnd = __classPrivateFieldGet(this, _a, "f", _UIHelper_rndAlbumArt)[dirname] = {
                currentIndex: null,
                uris: []
            };
            fs_1.default.readdirSync(dir).forEach((file) => {
                if (fs_1.default.lstatSync(path_1.default.resolve(dir, file)).isFile()) {
                    const uriPath = uriPathPrefix + file;
                    rnd.uris.push(`/albumart?sourceicon=${encodeURIComponent(uriPath)}`);
                }
            });
        }
        if (!rnd.uris) {
            return null;
        }
        if (rnd.currentIndex === null) {
            rnd.uris = (0, array_shuffle_1.default)(rnd.uris);
            rnd.currentIndex = 0;
        }
        const albumart = rnd.uris[rnd.currentIndex] || null;
        rnd.currentIndex++;
        if (rnd.currentIndex >= rnd.uris.length) {
            rnd.currentIndex = null;
        }
        return albumart;
    }
    static supportsEnhancedTitles() {
        return !this.isManifestUI();
    }
    static isManifestUI() {
        const volumioManifestUIDir = '/volumio/http/www4';
        const volumioManifestUIDisabledFile = '/data/disableManifestUI';
        return fs_1.default.existsSync(volumioManifestUIDir) && !fs_1.default.existsSync(volumioManifestUIDisabledFile);
    }
}
_a = UIHelper, _UIHelper_constructLinkItem = function _UIHelper_constructLinkItem(link) {
    let html = '';
    if (link.icon) {
        if (link.icon.type === 'fa' && link.icon.float !== 'right') {
            html += `<i class="${link.icon.class}" style="position: relative; top: 1px; margin-right: 2px; font-size: 16px;${link.icon.color ? ` color: ${link.icon.color};` : ''}"></i>`;
        }
        else if (link.icon.type === 'mixcloud') {
            html += `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/mixcloud/dist/assets/images/mixcloud-sq.png')}" style="width: 32px; height: 32px; margin-right: 5px; margin-top: -1px;" />`;
        }
    }
    html += `<a${link.target ? ` target="${link.target}"` : ''}${link.style ? ` style="${link.style}"` : ''} href="${link.url}"${link.onclick ? ` onclick="${link.onclick}"` : ''}>
                    ${link.text}
                </a>`;
    if (link.icon && link.icon.type === 'fa' && link.icon.float === 'right') {
        html += `<i class="${link.icon.class}" style="position: relative; top: 1px; margin-left: 2px; font-size: 16px;${link.icon.color ? ` color: ${link.icon.color};` : ''}"></i>`;
    }
    return html;
};
_UIHelper_rndAlbumArt = { value: null };
exports.default = UIHelper;
//# sourceMappingURL=UIHelper.js.map