import path from 'path';
import fs from 'fs';
import arrayShuffle from 'array-shuffle';
import mixcloud from '../MixcloudContext';

export interface UILink {
  icon?: {
    type: 'fa' | 'mixcloud',
    float?: string,
    color?: string,
    class?: string
  };
  style?: string;
  target?: string;
  text: string;
  url: string;
  onclick?: string;
}

export const UI_STYLES = {
  EXCLUSIVE: 'color: #b38536; font-size: 10px; padding-right: 8px;',
  NEXT_PAGE: 'color: #7a848e;',
  LIST_ITEM_SELECTED: 'color: #54c688; font-weight: bold;',
  TITLE_CASE: 'text-transform: capitalize;',
  DESCRIPTION: 'color: #ddd; font-size: 14px; padding-top: 12px;',
  EXCLUSIVE_DESC: 'color: #ce9a42; font-size: 14px; font-weight: bold;',
  VIEW_LINK: 'color: #ebaca0;',
  PARAMS_LIST_ITEM_NAME: 'color: #ccc; margin-right: 5px;'
};

interface RandomAlbumArt {
  currentIndex: number | null;
  uris: string[];
}

export default class UIHelper {

  static #rndAlbumArt: Record<string, RandomAlbumArt> | null = null;

  static getMixcloudIcon() {
    return `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/mixcloud/dist/assets/images/mixcloud-sq.png')}" style="width: 32px; height: 32px; margin-right: 8px;" />`;
  }

  static addMixcloudIconToListTitle(s: string) {
    if (!this.supportsEnhancedTitles()) {
      return s;
    }
    return `${this.getMixcloudIcon()}${s}`;
  }

  static addIconToListTitle(faClass: string, s: string) {
    if (!this.supportsEnhancedTitles()) {
      return s;
    }
    return `<i class="${faClass}" style="padding-right: 15px;"></i>${s}`;
  }

  static styleText(s: string, style: string) {
    return `<span${style ? ` style='${style}'` : ''}>${s}</span>`;
  }

  static wrapInDiv(s: string, style: string) {
    return `<div${style ? ` style='${style}'` : ''}>${s}</div>`;
  }

  static addTextBefore(s: string, textToAdd: string, style: string) {
    return this.styleText(textToAdd, style) + s;
  }

  static addExclusiveText(s: string) {
    return this.addTextBefore(s, mixcloud.getI18n('MIXCLOUD_EXCLUSIVE'), UI_STYLES.EXCLUSIVE);
  }

  static getMoreText() {
    return this.styleText(mixcloud.getI18n('MIXCLOUD_MORE'), UI_STYLES.NEXT_PAGE);
  }

  static constructListTitleWithLink(title: string, links: UILink | UILink[], isFirstList: boolean) {
    if (!this.supportsEnhancedTitles()) {
      return title;
    }
    let html = `<div style="display: flex; width: 100%; align-items: flex-end;${isFirstList ? '' : ' margin-top: -24px;'}">
                    <div>${title}</div>
                    <div style="flex-grow: 1; text-align: right; font-size: small;">`;

    if (Array.isArray(links)) {
      links.forEach((link, index) => {
        html += this.#constructLinkItem(link);
        if (index < links.length - 1) {
          html += '<span style="padding: 0px 5px;">|</span>';
        }
      });
    }
    else {
      html += this.#constructLinkItem(links);
    }

    html += '</div></div>';

    return html;
  }

  static #constructLinkItem(link: UILink) {
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
  }

  static constructBrowsePageLink(text: string, uri: string, icon: UILink['icon']) {
    return {
      url: '#',
      text,
      onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${uri}'}, true)`,
      icon
    };
  }

  static getRandomAlbumArtFromDir(dirname: string) {
    const uriPathPrefix = `music_service/mixcloud/dist/assets/images/${dirname}/`;
    const dir = path.resolve(__dirname, `../../assets/images/${dirname}`);
    if (!this.#rndAlbumArt) {
      this.#rndAlbumArt = {};
    }
    let rnd = this.#rndAlbumArt[dirname];
    if (!rnd) {
      rnd = this.#rndAlbumArt[dirname] = {
        currentIndex: null,
        uris: []
      };
      fs.readdirSync(dir).forEach((file) => {
        if (fs.lstatSync(path.resolve(dir, file)).isFile()) {
          const uriPath = uriPathPrefix + file;
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
    return fs.existsSync(volumioManifestUIDir) && !fs.existsSync(volumioManifestUIDisabledFile);
  }
}
