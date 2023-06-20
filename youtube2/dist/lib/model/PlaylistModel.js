"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _PlaylistModel_instances, _PlaylistModel_getContinuationItems, _PlaylistModel_findSectionWithContinuation;
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
const Endpoint_1 = require("../types/Endpoint");
const util_1 = require("../util");
const EndpointModel_1 = __importDefault(require("./EndpointModel"));
class PlaylistModel extends EndpointModel_1.default {
    constructor() {
        super(...arguments);
        _PlaylistModel_instances.add(this);
    }
    async getContents(endpoint) {
        if (endpoint.type !== Endpoint_1.EndpointType.Browse && endpoint.type !== Endpoint_1.EndpointType.BrowseContinuation) {
            throw Error(`PlaylistModel.getContents() expects endpoint type Browse or BrowseContinuation, but got ${endpoint.type}`);
        }
        const contents = await super.getContents({ ...endpoint, type: endpoint.type });
        const loadAll = YouTube2Context_1.default.getConfigValue('loadFullPlaylists', false);
        if (!loadAll || !contents) {
            return contents;
        }
        // Look for section with continuation - there should only be one, if any.
        const targetSection = __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_findSectionWithContinuation).call(this, contents.sections);
        if (targetSection?.continuation) {
            YouTube2Context_1.default.getLogger().info(`[youtube2] PlaylistModel is going to recursively fetch continuation items for playlist with endpoint: ${JSON.stringify(endpoint)}).`);
            const continuationItems = await __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_getContinuationItems).call(this, targetSection.continuation);
            targetSection.items.push(...continuationItems);
            YouTube2Context_1.default.getLogger().info(`[youtube2] Total ${continuationItems.length} continuation items fetched. Total items in playlist: ${targetSection.items.length}.`);
            delete targetSection.continuation;
        }
        return contents;
    }
}
exports.default = PlaylistModel;
_PlaylistModel_instances = new WeakSet(), _PlaylistModel_getContinuationItems = async function _PlaylistModel_getContinuationItems(continuation, recursive = true, currentItems = []) {
    if (!continuation) {
        return [];
    }
    const contents = await this.getContents({ ...continuation.endpoint, type: Endpoint_1.EndpointType.BrowseContinuation });
    // There should only be one section for playlist continuation items
    const targetSection = contents?.sections?.[0];
    if (targetSection?.items) {
        currentItems.push(...targetSection.items);
        YouTube2Context_1.default.getLogger().info(`[youtube2] Fetched ${targetSection.items.length} continuation items.`);
        if (recursive && targetSection.continuation) {
            await (0, util_1.sleep)((0, util_1.rnd)(200, 400)); // Rate limit
            await __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_getContinuationItems).call(this, targetSection.continuation, recursive, currentItems);
            delete targetSection.continuation;
        }
    }
    return currentItems;
}, _PlaylistModel_findSectionWithContinuation = function _PlaylistModel_findSectionWithContinuation(sections) {
    if (!sections) {
        return null;
    }
    for (const section of sections) {
        if (section.continuation) {
            return section;
        }
        const nestedSections = section.items?.filter((item) => item.type === 'section');
        if (nestedSections?.length > 0) {
            const result = __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_findSectionWithContinuation).call(this, nestedSections);
            if (result) {
                return result;
            }
        }
    }
    return null;
};
//# sourceMappingURL=PlaylistModel.js.map