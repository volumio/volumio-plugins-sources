import View from './View';
export default class ViewHelper {
    #private;
    static getViewsFromUri(uri: string): View[];
    static constructUriSegmentFromView<V extends View>(view: V): string;
    static constructUriFromViews(views: View[]): string;
}
//# sourceMappingURL=ViewHelper.d.ts.map