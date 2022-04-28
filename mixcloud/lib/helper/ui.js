'use strict';

const path = require('path');
const fs = require('fs');
const arrayShuffle = require('array-shuffle');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');

class UIHelper {

    static getMixcloudIcon() {
        return `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/mixcloud/assets/images/mixcloud-sq.png')}" style="width: 32px; height: 32px; margin-right: 8px;" />`;
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
        return `<span${ style ? ' style=\'' + style + '\'' : ''}>${s}</span>`;
    }

    static wrapInDiv(s, style) {
        return `<div${ style ? ' style=\'' + style + '\'' : ''}>${s}</div>`;
    }

    static addTextBefore(s, textToAdd, style) {
        return this.styleText(textToAdd, style) + s;
    }

    static addExclusiveText(s) {
        return this.addTextBefore(s, mixcloud.getI18n('MIXCLOUD_EXCLUSIVE'), this.STYLES.EXCLUSIVE);
    }

    static getMoreText() {
        return this.styleText(mixcloud.getI18n('MIXCLOUD_MORE'), this.STYLES.NEXT_PAGE);
    }

    static constructListTitleWithLink(title, links, isFirstList) {
        if (!this.supportsEnhancedTitles()) {
            return title;
        }
        let html = `<div style="display: flex; width: 100%; align-items: flex-end;${isFirstList ? '' : ' margin-top: -24px;'}">
                    <div>${title}</div>
                    <div style="flex-grow: 1; text-align: right; font-size: small;">`;

        if (Array.isArray(links)) {
            links.forEach( (link, index) => {
                html += this._constructLinkItem(link);
                if (index < links.length - 1) {
                    html += '<span style="padding: 0px 5px;">|</span>';
                }
            })
        }
        else {
            html += this._constructLinkItem(links);
        }

        html += '</div></div>';

        return html;
    }

    static _constructLinkItem(link) {
        let html = '';
        if (link.icon) {
            if (link.icon.type === 'fa' && link.icon.float !== 'right') {
                html += `<i class="${link.icon.class}" style="position: relative; top: 1px; margin-right: 2px; font-size: 16px;${ link.icon.color ? ' color: ' + link.icon.color + ';': ''}"></i>`;
            }
            else if (link.icon.type === 'mixcloud') {
                html += `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/mixcloud/assets/images/mixcloud-sq.png')}" style="width: 32px; height: 32px; margin-right: 5px; margin-top: -1px;" />`;
            }
        }
        html += `<a${link.target ? ' target="' + link.target + '"' : ''}${link.style ? ' style="' + link.style + '"' : ''} href="${link.url}"${link.onclick ? ' onclick="' + link.onclick + '"' : ''}>
                    ${link.text}
                </a>`;
        if (link.icon && link.icon.type === 'fa' && link.icon.float === 'right') {
            html += `<i class="${link.icon.class}" style="position: relative; top: 1px; margin-left: 2px; font-size: 16px;${ link.icon.color ? ' color: ' + link.icon.color + ';': ''}"></i>`;
        }

        return html;
    }

    static constructBrowsePageLink(text, uri, icon) {
        return {
            url: '#',
            text,
            onclick: 'angular.element(\'#browse-page\').scope().browse.fetchLibrary({uri: \'' + uri + '\'}, true)',
            icon
        };
    }

    static getRandomAlbumArtFromDir(dirname) {
        let uriPathPrefix = `music_service/mixcloud/assets/images/${dirname}/`;
        let dir = `${mixcloudPluginLibRoot}/../assets/images/${dirname}/`;
        if (!this.rndAlbumArt) {
            this.rndAlbumArt = {};
        }
        let rnd = this.rndAlbumArt[dirname];
        if (!rnd) {
            rnd = this.rndAlbumArt[dirname] = {
                currentIndex: null,
                uris: []
            };
            fs.readdirSync(dir).forEach(file => {
                if (fs.lstatSync(path.resolve(dir, file)).isFile()) {
                    let uriPath = uriPathPrefix + file;
                    rnd.uris.push(
                        `/albumart?sourceicon=${encodeURIComponent(uriPath)}`
                    );
                }
            });
        }
        if (!rnd.uris) {
            return null;
        }
        if (rnd.currentIndex === null) {
            rnd.uris = arrayShuffle(rnd.uris);
            rnd.currentIndex = 0;
        }
        let albumart = rnd.uris[rnd.currentIndex] || null;
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
        let volumioManifestUIFlagFile = '/data/manifestUI';
        let volumioManifestUIDisabledFile = '/data/disableManifestUI';
        return fs.existsSync(volumioManifestUIFlagFile) && !fs.existsSync(volumioManifestUIDisabledFile);
    }
}

UIHelper.STYLES = {
    EXCLUSIVE: 'color: #b38536; font-size: 10px; padding-right: 8px;',
    NEXT_PAGE: 'color: #7a848e;',
    LIST_ITEM_SELECTED: 'color: #54c688; font-weight: bold;',
    TITLE_CASE: 'text-transform: capitalize;',
    DESCRIPTION: 'color: #ddd; font-size: 14px; padding-top: 12px;',
    EXCLUSIVE_DESC: 'color: #ce9a42; font-size: 14px; font-weight: bold;',
    VIEW_LINK: 'color: #ebaca0;',
    PARAMS_LIST_ITEM_NAME: 'color: #ccc; margin-right: 5px;'
}

module.exports = UIHelper;