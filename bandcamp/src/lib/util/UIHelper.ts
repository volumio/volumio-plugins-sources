import { existsSync } from 'fs';
import bandcamp from '../BandcampContext';

export interface UILink {
  icon?: {
    type: 'fa' | 'bandcamp',
    float?: string,
    color?: string,
    class?: string
  };
  target?: string;
  text: string;
  url: string;
  onclick?: string;
}

export interface UIDoubleLine {
  imgSrc?: string;
  title: string;
  secondaryTitle: string;
  link: UILink;
}

export const UI_STYLES = {
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

export default class UIHelper {

  static getBandcampIcon() {
    return `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/bandcamp/dist/assets/images/bandcamp.svg')}" style="width: 23px; height: 23px; margin-right: 8px; margin-top: -3px;" />`;
  }
  static addBandcampIconToListTitle(s: string) {
    if (!this.supportsEnhancedTitles()) {
      return s;
    }
    return `${this.getBandcampIcon()}${s}`;
  }

  static addIconToListTitle(faClass: string, s: string) {
    if (!this.supportsEnhancedTitles()) {
      return s;
    }
    return `<i class="${faClass}" style="padding-right: 15px;"></i>${s}`;
  }

  static styleText(s: string, style?: string) {
    return `<span${style ? ` style='${style}'` : ''}>${s}</span>`;
  }

  static wrapInDiv(s: string, style?: string) {
    return `<div${style ? ` style='${style}'` : ''}>${s}</div>`;
  }

  static addTextBefore(s: string, textToAdd: string, style?: string) {
    return this.styleText(textToAdd, style) + s;
  }

  static addNonPlayableText(s: string) {
    return this.addTextBefore(s, bandcamp.getI18n('BANDCAMP_NON_PLAYABLE'), UI_STYLES.NON_PLAYABLE);
  }

  static getMoreText() {
    return this.styleText(bandcamp.getI18n('BANDCAMP_MORE'), UI_STYLES.NEXT_PAGE);
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
  }

  static constructDoubleLineTitleWithImageAndLink(params: UIDoubleLine) {
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
                ${this.#constructLinkItem(link)}
            </div>
        </div>
        `;
  }

  static reformatDate(date: string) {
    return new Date(Date.parse(date)).toLocaleDateString();
  }

  static supportsEnhancedTitles() {
    return !this.isManifestUI();
  }

  static isManifestUI() {
    const volumioManifestUIDir = '/volumio/http/www4';
    const volumioManifestUIDisabledFile = '/data/disableManifestUI';
    return existsSync(volumioManifestUIDir) && !existsSync(volumioManifestUIDisabledFile);
  }
}
