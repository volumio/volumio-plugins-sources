"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BaseRenderer_uri, _BaseRenderer_currentView, _BaseRenderer_previousViews;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../../BandcampContext"));
const UIHelper_1 = __importStar(require("../../../../util/UIHelper"));
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
    addType(type, text) {
        return UIHelper_1.default.addTextBefore(text, BandcampContext_1.default.getI18n(`BANDCAMP_${type.toUpperCase()}`), UIHelper_1.UI_STYLES.RESOURCE_TYPE);
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
_BaseRenderer_uri = new WeakMap(), _BaseRenderer_currentView = new WeakMap(), _BaseRenderer_previousViews = new WeakMap();
//# sourceMappingURL=BaseRenderer.js.map