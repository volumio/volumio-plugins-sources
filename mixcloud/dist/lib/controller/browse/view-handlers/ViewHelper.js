"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _ViewHelper_getViewFromUriSegment;
Object.defineProperty(exports, "__esModule", { value: true });
class ViewHelper {
    static getViewsFromUri(uri) {
        const segments = uri.split('/');
        if (segments[0] !== 'mixcloud') {
            return [];
        }
        const result = [];
        segments.forEach((segment, index) => {
            let view;
            if (index === 0) { // 'mixcloud/...'
                view = {
                    name: 'root'
                };
            }
            else {
                view = __classPrivateFieldGet(this, _a, "m", _ViewHelper_getViewFromUriSegment).call(this, segment);
            }
            result.push(view);
        });
        return result;
    }
    static constructUriSegmentFromView(view) {
        let segment;
        if (view.name === 'root') {
            segment = 'mixcloud';
        }
        else {
            segment = view.name;
        }
        const skip = ['name', 'pageRef', 'prevPageRefs', 'noExplode', 'inSection'];
        Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
            if (view[key] !== undefined) {
                segment += `@${key}=${encodeURIComponent(view[key])}`;
            }
        });
        if (view.prevPageRefs) {
            segment += `@$prevPageRefs=${encodeURIComponent(JSON.stringify(view.prevPageRefs))}`;
        }
        if (view.pageRef) {
            segment += `@pageRef=${encodeURIComponent(JSON.stringify(view.pageRef))}`;
        }
        return segment;
    }
    static constructUriFromViews(views) {
        const segments = views.map((view) => this.constructUriSegmentFromView(view));
        return segments.join('/');
    }
}
_a = ViewHelper, _ViewHelper_getViewFromUriSegment = function _ViewHelper_getViewFromUriSegment(segment) {
    const result = {
        name: '',
        startIndex: 0
    };
    segment.split('@').forEach((s) => {
        const equalIndex = s.indexOf('=');
        if (equalIndex < 0) {
            result.name = s;
        }
        else {
            const key = s.substring(0, equalIndex);
            const value = s.substring(equalIndex + 1);
            if (key === 'pageRef' || key === 'prevPageRefs') {
                result[key] = JSON.parse(decodeURIComponent(value));
            }
            else {
                result[key] = decodeURIComponent(value);
            }
        }
    });
    return result;
};
exports.default = ViewHelper;
//# sourceMappingURL=ViewHelper.js.map