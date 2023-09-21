"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SelectionModel_instances, _SelectionModel_getSelectionsFetchPromise, _SelectionModel_getSelectionsFromFetchResult, _SelectionModel_convertFetchedSelectionToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const Mapper_1 = __importDefault(require("./Mapper"));
class SelectionModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _SelectionModel_instances.add(this);
    }
    getSelections(options) {
        if (!options.mixed) {
            const result = {
                items: [],
                nextPageToken: null,
                nextPageOffset: 0
            };
            return result;
        }
        return this.loopFetch({
            callbackParams: {},
            getFetchPromise: __classPrivateFieldGet(this, _SelectionModel_instances, "m", _SelectionModel_getSelectionsFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _SelectionModel_instances, "m", _SelectionModel_getSelectionsFromFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _SelectionModel_instances, "m", _SelectionModel_convertFetchedSelectionToEntity).bind(this)
        });
    }
}
exports.default = SelectionModel;
_SelectionModel_instances = new WeakSet(), _SelectionModel_getSelectionsFetchPromise = function _SelectionModel_getSelectionsFetchPromise() {
    const api = this.getSoundCloudAPI();
    // Only mixed selections supported (without options)
    return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('selections', { mixed: true }), () => api.getMixedSelections());
}, _SelectionModel_getSelectionsFromFetchResult = function _SelectionModel_getSelectionsFromFetchResult(result) {
    return result.items;
}, _SelectionModel_convertFetchedSelectionToEntity = function _SelectionModel_convertFetchedSelectionToEntity(item) {
    return Mapper_1.default.mapSelection(item);
};
//# sourceMappingURL=SelectionModel.js.map