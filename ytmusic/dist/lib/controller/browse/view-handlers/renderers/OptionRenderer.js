"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _OptionRenderer_instances, _OptionRenderer_renderContinuationBundleOptionToListItem, _OptionRenderer_getGenericViewUri, _OptionRenderer_getDisplayText;
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const EXCLUDE_VIEW_PARAMS = ['name', 'continuation', 'endpoint', 'continuationBundle'];
const CHIP_STYLE_COMMON = 'display: inline-block; padding: 5px 12px; margin-right: 10px; border-radius: 5px;';
const CHIP_STYLE_UNSELECTED = `${CHIP_STYLE_COMMON} background: rgba(255, 255, 255, 0.15); color: #fff;`;
const CHIP_STYLE_SELECTED = `${CHIP_STYLE_COMMON} background: #fff; color: #000;`;
class OptionRenderer extends BaseRenderer_1.default {
    constructor() {
        super(...arguments);
        _OptionRenderer_instances.add(this);
    }
    renderToListItem(data) {
        if (data.type === 'continuationBundleOption') {
            return __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_renderContinuationBundleOptionToListItem).call(this, data);
        }
        const targetView = {
            name: 'optionSelection',
            genericViewUri: __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_getGenericViewUri).call(this),
            option: data
        };
        return {
            service: 'ytmusic',
            type: 'item-no-menu',
            title: __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_getDisplayText).call(this, data),
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
        const targetView = {
            name: 'optionSelection',
            fromContinuationBundle: '1',
            continuationBundle: bundle,
            targetKey: data.targetKey,
            genericViewUri: __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_getGenericViewUri).call(this)
        };
        return {
            service: 'ytmusic',
            type: 'item-no-menu',
            title: __classPrivateFieldGet(this, _OptionRenderer_instances, "m", _OptionRenderer_getDisplayText).call(this, option),
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
}, _OptionRenderer_getDisplayText = function _OptionRenderer_getDisplayText(option) {
    if (option.subtype !== 'chipCloud') {
        const selected = option.optionValues.find((ov) => ov.selected) || null;
        return selected ? selected.text : option.optionValues[0].text;
    }
    // ChipCloud - show each option value as a chip
    const displayText = option.optionValues.reduce((result, ov) => {
        if (ov.isReset) {
            return result;
        }
        const style = ov.selected ? CHIP_STYLE_SELECTED : CHIP_STYLE_UNSELECTED;
        result += `<span style='${style}'>${ov.text}</span>`;
        return result;
    }, '');
    return displayText;
};
//# sourceMappingURL=OptionRenderer.js.map