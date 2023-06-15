"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _RootViewHandler_instances, _RootViewHandler_getFanSummary, _RootViewHandler_getArticles, _RootViewHandler_getShows, _RootViewHandler_getDiscoverResults, _RootViewHandler_getSectionLists;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
class RootViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _RootViewHandler_instances.add(this);
    }
    async browse() {
        const myUsername = BandcampContext_1.default.getConfigValue('myUsername', null);
        const fetches = myUsername ? [__classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getFanSummary).call(this, myUsername)] : [];
        fetches.push(__classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getArticles).call(this), __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getShows).call(this), __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getDiscoverResults).call(this));
        const sectionLists = await Promise.all(fetches);
        const flattenedLists = sectionLists.reduce((result, list) => {
            result.push(...list);
            return result;
        }, []);
        return {
            navigation: {
                prev: { uri: '/' },
                lists: flattenedLists
            }
        };
    }
}
exports.default = RootViewHandler;
_RootViewHandler_instances = new WeakSet(), _RootViewHandler_getFanSummary = function _RootViewHandler_getFanSummary(username) {
    return __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getSectionLists).call(this, `${this.uri}/fan@username=${username}`);
}, _RootViewHandler_getArticles = function _RootViewHandler_getArticles() {
    return __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getSectionLists).call(this, `${this.uri}/article@inSection=1`);
}, _RootViewHandler_getShows = function _RootViewHandler_getShows() {
    return __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getSectionLists).call(this, `${this.uri}/show@inSection=1`);
}, _RootViewHandler_getDiscoverResults = function _RootViewHandler_getDiscoverResults() {
    return __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getSectionLists).call(this, `${this.uri}/discover@inSection=1`);
}, _RootViewHandler_getSectionLists = async function _RootViewHandler_getSectionLists(uri) {
    const handler = ViewHandlerFactory_1.default.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
};
//# sourceMappingURL=RootViewHandler.js.map