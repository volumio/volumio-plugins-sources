"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SearchViewHandler_instances, _SearchViewHandler_spliceShowingResultsFor;
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../../../YouTube2Context"));
const Endpoint_1 = require("../../../types/Endpoint");
const GenericViewHandler_1 = __importDefault(require("./GenericViewHandler"));
class SearchViewHandler extends GenericViewHandler_1.default {
    constructor() {
        super(...arguments);
        _SearchViewHandler_instances.add(this);
    }
    getEndpoint() {
        const view = this.currentView;
        if (!view.continuation && !view.endpoint) {
            const query = view.query ? view.query.trim() : '';
            if (query) {
                const endpoint = {
                    type: Endpoint_1.EndpointType.Search,
                    payload: {
                        query
                    }
                };
                return endpoint;
            }
            return null;
        }
        return super.getEndpoint();
    }
    async getContents() {
        const contents = await super.getContents();
        const view = this.currentView;
        // There should be no header for search results. We can insert our title here.
        // If viewing continuation results, then the title would be in the continuationBundle.
        if (!view.continuation && !contents.header) {
            const query = this.getEndpoint()?.payload?.query;
            if (query) {
                contents.header = {
                    type: 'search',
                    title: YouTube2Context_1.default.getI18n('YOUTUBE2_SEARCH_TITLE', query)
                };
            }
        }
        if (contents?.sections && !view.continuation) {
            // Extract 'Showing Results For' endpoint item. If it exists, move it to its
            // Own section.
            for (const section of contents.sections) {
                const showingResultsForItem = __classPrivateFieldGet(this, _SearchViewHandler_instances, "m", _SearchViewHandler_spliceShowingResultsFor).call(this, section);
                if (showingResultsForItem) {
                    contents.sections.unshift({
                        type: 'section',
                        items: showingResultsForItem
                    });
                    break;
                }
            }
        }
        return contents;
    }
}
exports.default = SearchViewHandler;
_SearchViewHandler_instances = new WeakSet(), _SearchViewHandler_spliceShowingResultsFor = function _SearchViewHandler_spliceShowingResultsFor(section) {
    if (!section.items?.length) {
        return null;
    }
    let spliced = null;
    section.items.some((item, itemIndex) => {
        if (item.type === 'section') {
            spliced = __classPrivateFieldGet(this, _SearchViewHandler_instances, "m", _SearchViewHandler_spliceShowingResultsFor).call(this, item);
        }
        else if (item.type === 'endpointLink' && item.icon === 'YT2_SHOWING_RESULTS_FOR') {
            spliced = section.items.splice(itemIndex, 1);
        }
        return !!spliced;
    });
    return spliced;
};
//# sourceMappingURL=SearchViewHandler.js.map