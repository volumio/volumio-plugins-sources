import View from './View';
export default class ViewHelper {
    static getViewsFromUri(uri: string): View[];
    static constructUriSegmentFromView<V extends View>(view: V): string;
    static getViewFromUriSegment(segment: string): View;
    static constructPrevUri(currentView: View, previousViews: View[]): string;
    static constructUriFromViews(views: View[]): string;
}
//# sourceMappingURL=ViewHelper.d.ts.map