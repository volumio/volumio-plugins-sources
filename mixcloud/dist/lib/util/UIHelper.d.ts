export interface UILink {
    icon?: {
        type: 'fa' | 'mixcloud';
        float?: string;
        color?: string;
        class?: string;
    };
    style?: string;
    target?: string;
    text: string;
    url: string;
    onclick?: string;
}
export declare const UI_STYLES: {
    EXCLUSIVE: string;
    NEXT_PAGE: string;
    LIST_ITEM_SELECTED: string;
    TITLE_CASE: string;
    DESCRIPTION: string;
    EXCLUSIVE_DESC: string;
    VIEW_LINK: string;
    PARAMS_LIST_ITEM_NAME: string;
};
export default class UIHelper {
    #private;
    static getMixcloudIcon(): string;
    static addMixcloudIconToListTitle(s: string): string;
    static addIconToListTitle(faClass: string, s: string): string;
    static styleText(s: string, style: string): string;
    static wrapInDiv(s: string, style: string): string;
    static addTextBefore(s: string, textToAdd: string, style: string): string;
    static addExclusiveText(s: string): string;
    static getMoreText(): string;
    static constructListTitleWithLink(title: string, links: UILink | UILink[], isFirstList: boolean): string;
    static constructBrowsePageLink(text: string, uri: string, icon: UILink['icon']): {
        url: string;
        text: string;
        onclick: string;
        icon: {
            type: "fa" | "mixcloud";
            float?: string | undefined;
            color?: string | undefined;
            class?: string | undefined;
        } | undefined;
    };
    static getRandomAlbumArtFromDir(dirname: string): string | null;
    static supportsEnhancedTitles(): boolean;
    static isManifestUI(): boolean;
}
//# sourceMappingURL=UIHelper.d.ts.map