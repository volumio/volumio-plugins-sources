"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _UIHelper_constructLinkItem;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI_STYLES = void 0;
const fs_1 = require("fs");
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
exports.UI_STYLES = {
    NON_PLAYABLE: 'color: #b38536; font-size: 10px; padding-right: 8px;',
    NEXT_PAGE: 'color: #7a848e;',
    LIST_ITEM_SELECTED: 'color: #54c688; font-weight: bold;',
    RESOURCE_TYPE: 'color: #999; font-size: 10px; padding-right: 8px;',
    ARTICLE_SECTION: {
        TEXT: 'color: #ddd; font-size: 16px; line-height: 24px; padding: 16px 0px 48px 0px; text-align: justify;',
        MEDIA_ITEM_NAME: 'font-size: 16px; font-weight: bold; font-style: italic;',
        MEDIA_ITEM_ARTIST: 'font-size: 16px; font-weight: bold;'
    }
};
class UIHelper {
    static getBandcampIcon() {
        return `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/bandcamp/dist/assets/images/bandcamp.svg')}" style="width: 23px; height: 23px; margin-right: 8px; margin-top: -3px;" />`;
    }
    static addBandcampIconToListTitle(s) {
        if (!this.supportsEnhancedTitles()) {
            return s;
        }
        return `${this.getBandcampIcon()}${s}`;
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
    static addNonPlayableText(s) {
        return this.addTextBefore(s, BandcampContext_1.default.getI18n('BANDCAMP_NON_PLAYABLE'), exports.UI_STYLES.NON_PLAYABLE);
    }
    static getMoreText() {
        return this.styleText(BandcampContext_1.default.getI18n('BANDCAMP_MORE'), exports.UI_STYLES.NEXT_PAGE);
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
    static constructDoubleLineTitleWithImageAndLink(params) {
        if (!this.supportsEnhancedTitles()) {
            return params.title;
        }
        const { imgSrc, title, secondaryTitle, link } = params;
        const imgHtml = imgSrc ? `<div>
            <img src="${imgSrc}" style="width: 48px; height: 48px; margin-right: 12px; margin-top: -3px; border-radius: 50%;"></div>`
            : '';
        return `
        <div style="display: flex; width: 100%; align-items: center;">
            ${imgHtml}
            <div style="flex-grow: 1">
                <div>${title}</div>
                <div style="color: #9c9c9c; font-size: 14px; padding-top: 3px;">${secondaryTitle}</div>
            </div>
            <div style="text-align: right; font-size: small;">
                ${__classPrivateFieldGet(this, _a, "m", _UIHelper_constructLinkItem).call(this, link)}
            </div>
        </div>
        `;
    }
    static reformatDate(date) {
        return new Date(Date.parse(date)).toLocaleDateString();
    }
    static supportsEnhancedTitles() {
        return !this.isManifestUI();
    }
    static isManifestUI() {
        const volumioManifestUIDir = '/volumio/http/www4';
        const volumioManifestUIDisabledFile = '/data/disableManifestUI';
        return (0, fs_1.existsSync)(volumioManifestUIDir) && !(0, fs_1.existsSync)(volumioManifestUIDisabledFile);
    }
}
exports.default = UIHelper;
_a = UIHelper, _UIHelper_constructLinkItem = function _UIHelper_constructLinkItem(link) {
    let html = '';
    if (link.icon) {
        if (link.icon.type === 'fa' && link.icon.float !== 'right') {
            html += `<i class="${link.icon.class}" style="position: relative; top: 1px; margin-right: 2px; font-size: 16px;${link.icon.color ? ` color: ${link.icon.color};` : ''}"></i>`;
        }
        else if (link.icon.type === 'bandcamp') {
            html += `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/bandcamp/dist/assets/images/bandcamp.svg')}" style="width: 23px; height: 23px; margin-top: -3px;" />`;
        }
    }
    html += `<a${link.target ? ` target="${link.target}"` : ''} href="${link.url}"${link.onclick ? ` onclick="${link.onclick}"` : ''}>
                    ${link.text}
                </a>`;
    if (link.icon && link.icon.type === 'fa' && link.icon.float === 'right') {
        html += `<i class="${link.icon.class}" style="position: relative; top: 1px; margin-left: 2px; font-size: 16px;${link.icon.color ? ` color: ${link.icon.color};` : ''}"></i>`;
    }
    return html;
};
//# sourceMappingURL=UIHelper.js.map