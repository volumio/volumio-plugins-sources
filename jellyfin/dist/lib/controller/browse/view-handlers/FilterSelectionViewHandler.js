"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FilterSelectionViewHandler_instances, _FilterSelectionViewHandler_getBaseUri, _FilterSelectionViewHandler_getFilterOptionsList, _FilterSelectionViewHandler_getFilterOptionUri;
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../../../model");
const FilterModel_1 = require("../../../model/filter/FilterModel");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
class FilterSelectionViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _FilterSelectionViewHandler_instances.add(this);
    }
    async browse() {
        const prevUri = this.constructPrevUri();
        const lastView = this.previousViews[this.previousViews.length - 1];
        const filterView = JSON.parse(this.currentView.filterView);
        const combinedView = {
            ...lastView,
            ...filterView
        };
        let filterType;
        let model;
        switch (this.currentView.name) {
            case 'filter.az':
                filterType = FilterModel_1.FilterType.AZ;
                model = this.getModel(model_1.ModelType.AZFilter);
                break;
            case 'filter.filter':
                filterType = FilterModel_1.FilterType.Filter;
                model = this.getModel(model_1.ModelType.FilterFilter);
                break;
            case 'filter.genre':
                filterType = FilterModel_1.FilterType.Genre;
                model = this.getModel(model_1.ModelType.GenreFilter);
                break;
            case 'filter.sort':
                filterType = FilterModel_1.FilterType.Sort;
                model = this.getModel(model_1.ModelType.SortFilter);
                break;
            case 'filter.year':
                filterType = FilterModel_1.FilterType.Year;
                model = this.getModel(model_1.ModelType.YearFilter);
                break;
            default:
                throw Error(`Unknown filter: ${this.currentView.name}`);
        }
        const modelConfig = ViewHelper_1.default.getFilterModelConfigFromView(combinedView, filterType);
        if (!modelConfig) {
            throw Error('Invalid filter view');
        }
        const filter = await model.getFilter(modelConfig);
        let lists;
        if (filter.subfilters) {
            const sublists = filter.subfilters.map((f) => __classPrivateFieldGet(this, _FilterSelectionViewHandler_instances, "m", _FilterSelectionViewHandler_getFilterOptionsList).call(this, f));
            lists = sublists.reduce((result, list) => {
                return [
                    ...result,
                    ...list
                ];
            }, []);
        }
        else {
            lists = __classPrivateFieldGet(this, _FilterSelectionViewHandler_instances, "m", _FilterSelectionViewHandler_getFilterOptionsList).call(this, filter);
        }
        return {
            navigation: {
                prev: { uri: prevUri },
                lists
            }
        };
    }
    constructPrevUri() {
        return this.previousViews.map((view) => ViewHelper_1.default.constructUriSegmentFromView(view)).join('/');
    }
}
exports.default = FilterSelectionViewHandler;
_FilterSelectionViewHandler_instances = new WeakSet(), _FilterSelectionViewHandler_getBaseUri = function _FilterSelectionViewHandler_getBaseUri(field) {
    const previousViews = [...this.previousViews];
    const lastView = { ...previousViews[previousViews.length - 1] };
    delete lastView[field];
    delete lastView.startIndex;
    previousViews.pop();
    const segments = previousViews.map((view) => ViewHelper_1.default.constructUriSegmentFromView(view));
    segments.push(ViewHelper_1.default.constructUriSegmentFromView(lastView));
    return segments.join('/');
}, _FilterSelectionViewHandler_getFilterOptionsList = function _FilterSelectionViewHandler_getFilterOptionsList(filter) {
    if (!filter.field || !filter.options) {
        return [];
    }
    const baseUri = __classPrivateFieldGet(this, _FilterSelectionViewHandler_instances, "m", _FilterSelectionViewHandler_getBaseUri).call(this, filter.field);
    const remember = JellyfinContext_1.default.getConfigValue('rememberFilters');
    const items = filter.options.map((option) => ({
        service: 'jellyfin',
        type: 'jellyfin-filter-option',
        title: option.name,
        icon: option.selected ? 'fa fa-check' : 'fa',
        uri: __classPrivateFieldGet(this, _FilterSelectionViewHandler_instances, "m", _FilterSelectionViewHandler_getFilterOptionUri).call(this, baseUri, filter, option, remember)
    }));
    const lists = [];
    if (filter.resettable) {
        lists.push({
            availableListViews: ['list'],
            items: [
                {
                    service: 'jellyfin',
                    type: 'jellyfin-filter-option',
                    title: JellyfinContext_1.default.getI18n('JELLYFIN_RESET'),
                    icon: 'fa fa-ban',
                    uri: __classPrivateFieldGet(this, _FilterSelectionViewHandler_instances, "m", _FilterSelectionViewHandler_getFilterOptionUri).call(this, baseUri, filter, null, remember)
                }
            ]
        });
    }
    lists.push({
        availableListViews: ['list'],
        items
    });
    lists[0].title = filter.title;
    return lists;
}, _FilterSelectionViewHandler_getFilterOptionUri = function _FilterSelectionViewHandler_getFilterOptionUri(baseUri, filter, option, remember) {
    // `filter: null` corresponds to reset filter item
    const uri = option ? baseUri + (option.value ? `@${filter.field}=${encodeURIComponent(option.value)}` : '') : baseUri;
    if (remember) {
        const saveFilter = {
            field: filter.field,
            value: option ? option.value : null
        };
        return `${uri}@saveFilter=${encodeURIComponent(JSON.stringify(saveFilter))}`;
    }
    return uri;
};
//# sourceMappingURL=FilterSelectionViewHandler.js.map