"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _OptionValueRenderer_instances, _OptionValueRenderer_baseUri, _OptionValueRenderer_prevUri, _OptionValueRenderer_getBaseUri, _OptionValueRenderer_getPrevUri;
Object.defineProperty(exports, "__esModule", { value: true });
const Endpoint_1 = require("../../../../types/Endpoint");
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const ENDPOINT_TYPES = [Endpoint_1.EndpointType.Browse,
    Endpoint_1.EndpointType.Search,
    Endpoint_1.EndpointType.BrowseContinuation,
    Endpoint_1.EndpointType.SearchContinuation];
class OptionValueRenderer extends BaseRenderer_1.default {
    constructor() {
        super(...arguments);
        _OptionValueRenderer_instances.add(this);
        _OptionValueRenderer_baseUri.set(this, void 0);
        _OptionValueRenderer_prevUri.set(this, void 0);
    }
    renderToListItem(data, opts) {
        const view = this.currentView;
        const baseUri = __classPrivateFieldGet(this, _OptionValueRenderer_instances, "m", _OptionValueRenderer_getBaseUri).call(this);
        const prevUri = __classPrivateFieldGet(this, _OptionValueRenderer_instances, "m", _OptionValueRenderer_getPrevUri).call(this);
        let valueUri;
        if (data.endpoint?.type && ENDPOINT_TYPES.includes(data.endpoint.type)) {
            let targetView;
            if (view.genericViewUri) {
                targetView = ViewHelper_1.default.getViewFromUriSegment(view.genericViewUri);
            }
            else {
                targetView = {
                    name: 'generic'
                };
            }
            targetView.endpoint = data.endpoint;
            if (opts?.extraUriParams) {
                for (const [key, value] of Object.entries(opts.extraUriParams)) {
                    targetView[key] = value;
                }
            }
            valueUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
        }
        else if (data.selected) {
            valueUri = prevUri;
        }
        else {
            valueUri = baseUri;
        }
        return {
            service: 'youtube2',
            type: 'item-no-menu',
            title: data.text,
            icon: data.selected ? 'fa fa-check' : 'fa',
            uri: valueUri
        };
    }
}
exports.default = OptionValueRenderer;
_OptionValueRenderer_baseUri = new WeakMap(), _OptionValueRenderer_prevUri = new WeakMap(), _OptionValueRenderer_instances = new WeakSet(), _OptionValueRenderer_getBaseUri = function _OptionValueRenderer_getBaseUri() {
    if (!__classPrivateFieldGet(this, _OptionValueRenderer_baseUri, "f")) {
        const baseUriViews = [...this.previousViews];
        baseUriViews.pop();
        __classPrivateFieldSet(this, _OptionValueRenderer_baseUri, ViewHelper_1.default.constructUriFromViews(baseUriViews) || 'youtube2', "f");
    }
    return __classPrivateFieldGet(this, _OptionValueRenderer_baseUri, "f");
}, _OptionValueRenderer_getPrevUri = function _OptionValueRenderer_getPrevUri() {
    if (!__classPrivateFieldGet(this, _OptionValueRenderer_prevUri, "f")) {
        __classPrivateFieldSet(this, _OptionValueRenderer_prevUri, ViewHelper_1.default.constructPrevUri(this.currentView, this.previousViews), "f");
    }
    return __classPrivateFieldGet(this, _OptionValueRenderer_prevUri, "f");
};
//# sourceMappingURL=OptionValueRenderer.js.map