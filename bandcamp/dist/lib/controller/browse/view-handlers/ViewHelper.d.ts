import type View from './View';
export default class ViewHelper {
    #private;
    static getViewsFromUri(uri: string): View[];
    static constructUriSegmentFromView(view: View): string;
    static constructUriFromViews(views: View[]): string;
}
//# sourceMappingURL=ViewHelper.d.ts.map