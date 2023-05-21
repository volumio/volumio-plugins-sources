"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BaseRenderer_uri, _BaseRenderer_currentView, _BaseRenderer_previousViews, _BaseRenderer_albumArtHandler;
Object.defineProperty(exports, "__esModule", { value: true });
class BaseRenderer {
    constructor(uri, currentView, previousViews, albumArtHandler) {
        _BaseRenderer_uri.set(this, void 0);
        _BaseRenderer_currentView.set(this, void 0);
        _BaseRenderer_previousViews.set(this, void 0);
        _BaseRenderer_albumArtHandler.set(this, void 0);
        __classPrivateFieldSet(this, _BaseRenderer_uri, uri, "f");
        __classPrivateFieldSet(this, _BaseRenderer_currentView, currentView, "f");
        __classPrivateFieldSet(this, _BaseRenderer_previousViews, previousViews, "f");
        __classPrivateFieldSet(this, _BaseRenderer_albumArtHandler, albumArtHandler, "f");
    }
    renderToHeader(data) {
        return {
            'uri': __classPrivateFieldGet(this, _BaseRenderer_uri, "f"),
            'service': 'jellyfin',
            'type': 'song',
            'album': data.name,
            'albumart': this.getAlbumArt(data)
        };
    }
    getAlbumArt(data) {
        return __classPrivateFieldGet(this, _BaseRenderer_albumArtHandler, "f").getAlbumArtUri(data);
    }
    get uri() {
        return __classPrivateFieldGet(this, _BaseRenderer_uri, "f");
    }
    get currentView() {
        return __classPrivateFieldGet(this, _BaseRenderer_currentView, "f");
    }
    get previousViews() {
        return __classPrivateFieldGet(this, _BaseRenderer_previousViews, "f");
    }
    // https://github.com/volumio/Volumio2-UI/blob/master/src/app/browse-music/browse-music.controller.js
    timeFormat(time) {
        if (time) {
            // Hours, minutes and seconds
            const hrs = ~~(time / 3600);
            const mins = ~~((time % 3600) / 60);
            const secs = ~~time % 60;
            // Output like "1:01" or "4:03:59" or "123:03:59"
            let ret = '';
            if (hrs > 0) {
                ret += `${hrs}:${mins < 10 ? '0' : ''}`;
            }
            ret += `${mins}:${secs < 10 ? '0' : ''}`;
            ret += `${secs}`;
            return ret;
        }
        return null;
    }
    getStringFromIdNamePair(data) {
        return data.reduce((parts, d) => {
            parts.push(d.name);
            return parts;
        }, []).join(', ');
    }
}
exports.default = BaseRenderer;
_BaseRenderer_uri = new WeakMap(), _BaseRenderer_currentView = new WeakMap(), _BaseRenderer_previousViews = new WeakMap(), _BaseRenderer_albumArtHandler = new WeakMap();
//# sourceMappingURL=BaseRenderer.js.map