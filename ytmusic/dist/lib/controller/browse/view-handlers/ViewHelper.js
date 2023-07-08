"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ViewHelper {
    static getViewsFromUri(uri) {
        const segments = uri.split('/');
        if (segments[0] !== 'ytmusic') {
            return [];
        }
        const result = [];
        segments.forEach((segment, index) => {
            let view;
            if (index === 0) { // 'ytmusic/...'
                view = {
                    name: 'root'
                };
            }
            else {
                view = this.getViewFromUriSegment(segment);
            }
            result.push(view);
        });
        return result;
    }
    static constructUriSegmentFromView(view) {
        let segment;
        if (view.name === 'root') {
            segment = 'ytmusic';
        }
        else {
            segment = view.name;
        }
        const skip = ['name', 'noExplode'];
        Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
            if (view[key] !== undefined) {
                if (typeof view[key] === 'object') {
                    segment += `@${key}:o=${encodeURIComponent(JSON.stringify(view[key]))}`;
                }
                else {
                    segment += `@${key}=${encodeURIComponent(view[key])}`;
                }
            }
        });
        return segment;
    }
    static getViewFromUriSegment(segment) {
        const result = {
            name: ''
        };
        segment.split('@').forEach((s) => {
            const equalIndex = s.indexOf('=');
            if (equalIndex < 0) {
                result.name = s;
            }
            else {
                let key = s.substring(0, equalIndex);
                let value = decodeURIComponent(s.substring(equalIndex + 1));
                if (key.endsWith(':o')) { // `value` is object
                    key = key.substring(0, key.length - 2);
                    value = JSON.parse(value);
                }
                result[key] = value;
            }
        });
        return result;
    }
    static constructPrevUri(currentView, previousViews) {
        const segments = previousViews.map(((view) => ViewHelper.constructUriSegmentFromView(view)));
        if (currentView.continuation) {
            const newView = { ...currentView };
            delete newView.continuation;
            delete newView.prevContinuations;
            if (currentView.prevContinuations) {
                const prevContinuations = [...currentView.prevContinuations];
                const prevContinuation = prevContinuations.pop();
                if (prevContinuation && prevContinuations.length > 0) {
                    newView.prevContinuations = prevContinuations;
                }
                if (prevContinuation) {
                    newView.continuation = prevContinuation;
                }
            }
            if (!newView.continuation) {
                delete newView.continuationBundle;
            }
            segments.push(ViewHelper.constructUriSegmentFromView(newView));
        }
        return segments.join('/');
    }
    static constructUriFromViews(views) {
        const segments = views.map((view) => this.constructUriSegmentFromView(view));
        return segments.join('/');
    }
}
exports.default = ViewHelper;
//# sourceMappingURL=ViewHelper.js.map