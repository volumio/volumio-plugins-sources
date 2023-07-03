export interface UILink {
    icon?: {
        type: 'fa' | 'bandcamp';
        float?: string;
        color?: string;
        class?: string;
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
export declare const UI_STYLES: {
    NON_PLAYABLE: string;
    NEXT_PAGE: string;
    LIST_ITEM_SELECTED: string;
    RESOURCE_TYPE: string;
    ARTICLE_SECTION: {
        TEXT: string;
        MEDIA_ITEM_NAME: string;
        MEDIA_ITEM_ARTIST: string;
    };
};
export default class UIHelper {
    #private;
    static getBandcampIcon(): string;
    static addBandcampIconToListTitle(s: string): string;
    static addIconToListTitle(faClass: string, s: string): string;
    static styleText(s: string, style?: string): string;
    static wrapInDiv(s: string, style?: string): string;
    static addTextBefore(s: string, textToAdd: string, style?: string): string;
    static addNonPlayableText(s: string): string;
    static getMoreText(): string;
    static constructListTitleWithLink(title: string, links: UILink | UILink[], isFirstList: boolean): string;
    static constructDoubleLineTitleWithImageAndLink(params: UIDoubleLine): string;
    static reformatDate(date: string): string;
    static supportsEnhancedTitles(): boolean;
    static isManifestUI(): boolean;
}
//# sourceMappingURL=UIHelper.d.ts.map