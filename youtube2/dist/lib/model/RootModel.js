"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _RootModel_instances, _RootModel_expandGuideSection, _RootModel_expandGuideEntry, _RootModel_filterGuideEntries;
Object.defineProperty(exports, "__esModule", { value: true });
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const BaseModel_1 = require("./BaseModel");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
const EndpointHelper_1 = __importDefault(require("../util/EndpointHelper"));
class RootModel extends BaseModel_1.BaseModel {
    constructor() {
        super(...arguments);
        _RootModel_instances.add(this);
    }
    async getContents(opts) {
        const { innertube } = await this.getInnertube();
        const guide = await innertube.getGuide();
        const sections = guide.contents.map((section) => __classPrivateFieldGet(this, _RootModel_instances, "m", _RootModel_expandGuideSection).call(this, section));
        const parsed = InnertubeResultParser_1.default.parseResult({ contents: sections });
        const primaryOnly = opts?.contentType === 'simple';
        if (parsed) {
            parsed.sections = parsed.sections.reduce((filtered, section) => {
                const filteredSection = __classPrivateFieldGet(this, _RootModel_instances, "m", _RootModel_filterGuideEntries).call(this, section, primaryOnly);
                if (filteredSection) {
                    filtered.push(filteredSection);
                }
                return filtered;
            }, []);
        }
        return parsed;
    }
}
exports.default = RootModel;
_RootModel_instances = new WeakSet(), _RootModel_expandGuideSection = function _RootModel_expandGuideSection(section) {
    const sectionItems = section.items.reduce((result, entry) => {
        result.push(...__classPrivateFieldGet(this, _RootModel_instances, "m", _RootModel_expandGuideEntry).call(this, entry));
        return result;
    }, []);
    const result = {
        type: section.type,
        title: section.title,
        items: sectionItems
    };
    return result;
}, _RootModel_expandGuideEntry = function _RootModel_expandGuideEntry(entry) {
    if (entry instanceof volumio_youtubei_js_1.YTNodes.GuideCollapsibleEntry) {
        const collapsibleEntry = entry;
        return collapsibleEntry.expandable_items.reduce((expanded, item) => {
            expanded.push(...__classPrivateFieldGet(this, _RootModel_instances, "m", _RootModel_expandGuideEntry).call(this, item));
            return expanded;
        }, []);
    }
    if (entry instanceof volumio_youtubei_js_1.YTNodes.GuideCollapsibleSectionEntry) {
        const sectionEntry = entry;
        const initialExpanded = sectionEntry.header_entry ? __classPrivateFieldGet(this, _RootModel_instances, "m", _RootModel_expandGuideEntry).call(this, sectionEntry.header_entry) : [];
        return sectionEntry.section_items.reduce((expanded, item) => {
            expanded.push(...__classPrivateFieldGet(this, _RootModel_instances, "m", _RootModel_expandGuideEntry).call(this, item));
            return expanded;
        }, initialExpanded);
    }
    return [entry];
}, _RootModel_filterGuideEntries = function _RootModel_filterGuideEntries(section, primaryOnly = false) {
    const filteredItems = [];
    section.items.forEach((item) => {
        if (item.type === 'section') {
            const filterNestedResult = __classPrivateFieldGet(this, _RootModel_instances, "m", _RootModel_filterGuideEntries).call(this, item, primaryOnly);
            if (filterNestedResult) {
                filteredItems.push(filterNestedResult);
            }
        }
        else if ((item.type === 'guideEntry' && primaryOnly ? item.isPrimary : true) && EndpointHelper_1.default.validate(item.endpoint)) {
            filteredItems.push(item);
        }
    });
    if (filteredItems.length > 0) {
        return {
            type: section.type,
            title: section.title,
            items: filteredItems
        };
    }
    return null;
};
//# sourceMappingURL=RootModel.js.map