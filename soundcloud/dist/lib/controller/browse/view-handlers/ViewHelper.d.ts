import View from './View';
export default class ViewHelper {
    static getViewsFromUri(uri: string): View[];
    static constructUriSegmentFromView<V extends View>(view: V, keepFlags?: boolean | Array<keyof typeof view>): string;
    static getViewFromUriSegment(segment: string): View;
    static constructPrevUri(currentView: View, previousViews: View[]): string;
    static constructUriFromViews(views: View[]): string;
    static supportsEnhancedTitles(): boolean;
    static isManifestUI(): boolean;
}
//# sourceMappingURL=ViewHelper.d.ts.map