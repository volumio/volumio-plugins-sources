"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _OptionSelectionViewHandler_instances, _OptionSelectionViewHandler_getListData;
Object.defineProperty(exports, "__esModule", { value: true });
const YTMusicContext_1 = __importDefault(require("../../../YTMusicContext"));
const Endpoint_1 = require("../../../types/Endpoint");
const EndpointHelper_1 = __importDefault(require("../../../util/EndpointHelper"));
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const renderers_1 = require("./renderers");
class OptionSelectionViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _OptionSelectionViewHandler_instances.add(this);
    }
    async browse() {
        const listData = __classPrivateFieldGet(this, _OptionSelectionViewHandler_instances, "m", _OptionSelectionViewHandler_getListData).call(this);
        const lists = [
            {
                title: listData.title,
                availableListViews: ['list'],
                items: listData.items
            }
        ];
        return {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                lists
            }
        };
    }
}
exports.default = OptionSelectionViewHandler;
_OptionSelectionViewHandler_instances = new WeakSet(), _OptionSelectionViewHandler_getListData = function _OptionSelectionViewHandler_getListData() {
    const view = this.currentView;
    const renderer = this.getRenderer(renderers_1.RendererType.OptionValue);
    let option, listItems = [];
    if (view.fromContinuationBundle && view.continuationBundle && view.targetKey) {
        const bundle = view.continuationBundle;
        // Deep copy
        const workBundle = JSON.parse(JSON.stringify(bundle));
        const keyParts = view.targetKey.split('.');
        const __setSelected = (option, index) => {
            option.optionValues.forEach((ov, i) => {
                option.optionValues[i].selected = (i === index);
            });
        };
        const __getTargetOption = (_bundle) => {
            const target = keyParts.reduce((targetValue, key) => targetValue[key], _bundle);
            if (typeof target === 'object' && target.type === 'option') {
                return target;
            }
            return null;
        };
        option = __getTargetOption(bundle);
        if (option) {
            listItems = option.optionValues.reduce((result, data, index) => {
                let extraUriParams;
                if (EndpointHelper_1.default.isType(data.endpoint, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.SearchContinuation)) {
                    const workOption = __getTargetOption(workBundle);
                    __setSelected(workOption, index);
                    extraUriParams = {
                        continuationBundle: workBundle
                    };
                }
                const listItem = renderer.renderToListItem(data, { extraUriParams });
                if (listItem) {
                    result.push(listItem);
                }
                return result;
            }, []);
        }
    }
    else if (view.option) {
        option = view.option;
        listItems = option.optionValues.reduce((result, data) => {
            const listItem = renderer.renderToListItem(data);
            if (listItem) {
                result.push(listItem);
            }
            return result;
        }, []);
    }
    let title = option?.title;
    if (!title && option && option.subtype === 'chipCloud') {
        title = YTMusicContext_1.default.getI18n('YTMUSIC_OPTION_SELECT_CHIP_CLOUD_TITLE');
    }
    return {
        title,
        items: listItems
    };
};
//# sourceMappingURL=OptionSelectionViewHandler.js.map