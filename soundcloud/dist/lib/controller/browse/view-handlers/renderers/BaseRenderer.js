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
var _BaseRenderer_uri, _BaseRenderer_currentView, _BaseRenderer_previousViews;
Object.defineProperty(exports, "__esModule", { value: true });
class BaseRenderer {
    constructor(uri, currentView, previousViews) {
        _BaseRenderer_uri.set(this, void 0);
        _BaseRenderer_currentView.set(this, void 0);
        _BaseRenderer_previousViews.set(this, void 0);
        __classPrivateFieldSet(this, _BaseRenderer_uri, uri, "f");
        __classPrivateFieldSet(this, _BaseRenderer_currentView, currentView, "f");
        __classPrivateFieldSet(this, _BaseRenderer_previousViews, previousViews, "f");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renderToHeader(data) {
        return null;
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
    getSoundCloudIcon() {
        return '/albumart?sourceicon=music_service/soundcloud/dist/assets/images/Antu_soundcloud.svg';
    }
    getAvatarIcon() {
        return '/albumart?sourceicon=music_service/soundcloud/dist/assets/images/avatar.png';
    }
}
exports.default = BaseRenderer;
_BaseRenderer_uri = new WeakMap(), _BaseRenderer_currentView = new WeakMap(), _BaseRenderer_previousViews = new WeakMap();
//# sourceMappingURL=BaseRenderer.js.map