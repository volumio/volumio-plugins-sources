"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _OptionRenderer_instances, _OptionRenderer_renderContinuationBundleOptionToListItem, _OptionRenderer_getGenericViewUri;
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const EXCLUDE_VIEW_PARAMS = ['name', 'continuation', 'endpoint', 'continuationBundle'];
class OptionRenderer extends BaseRenderer_1.default {
    constructor() {
        super(...arguments);
        _OptionRenderer_instances.add(this);
    }
    renderToListItem(data) {
        if (data.type === 'continuationBundleOption') {
            return __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_renderContinuationBundleOptionToListItem).call(this, data);
        }
        const optionData = data;
        const selected = optionData.optionValues.find((ov) => ov.selected) || optionData.optionValues[0];
        const targetView = {
            name: 'optionSelection',
            genericViewUri: __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_getGenericViewUri).call(this),
            option: data
        };
        return {
            service: 'youtube2',
            type: 'item-no-menu',
            title: selected.text,
            icon: 'fa fa-angle-down',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
}
exports.default = OptionRenderer;
_OptionRenderer_instances = new WeakSet(), _OptionRenderer_renderContinuationBundleOptionToListItem = function _OptionRenderer_renderContinuationBundleOptionToListItem(data) {
    const bundle = data.continuationBundle;
    const keyParts = data.targetKey.split('.');
    const option = keyParts.reduce((targetValue, key) => targetValue[key], bundle);
    if (typeof option === 'object' && option.type === 'option') {
        const selected = option.optionValues.find((ov) => ov.selected) || null;
        const displayText = selected ? (option.title ? `${option.title}: ${selected.text}` : selected.text) : (option.title || option.optionValues[0].text);
        const targetView = {
            name: 'optionSelection',
            fromContinuationBundle: '1',
            continuationBundle: bundle,
            targetKey: data.targetKey,
            genericViewUri: __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_getGenericViewUri).call(this)
        };
        return {
            service: 'youtube2',
            type: 'item-no-menu',
            title: displayText,
            icon: 'fa fa-angle-down',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
    return null;
}, _OptionRenderer_getGenericViewUri = function _OptionRenderer_getGenericViewUri() {
    const view = this.currentView;
    const genericViewParams = Object.keys(view).reduce((result, key) => {
        if (!EXCLUDE_VIEW_PARAMS.includes(key)) {
            result[key] = view[key];
        }
        return result;
    }, {});
    const genericView = {
        name: view.name,
        ...genericViewParams
    };
    return ViewHelper_1.default.constructUriSegmentFromView(genericView);
};
//# sourceMappingURL=OptionRenderer.js.map