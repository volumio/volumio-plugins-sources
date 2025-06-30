"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FilterableViewHandler_instances, _FilterableViewHandler_getFilterList, _FilterableViewHandler_getFilterSelection, _FilterableViewHandler_getDefaultFilterSelection, _FilterableViewHandler_getSavedFilterSelection, _FilterableViewHandler_getFilterListItemText, _FilterableViewHandler_saveFilters;
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const FilterModel_1 = require("../../../model/filter/FilterModel");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class FilterableViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _FilterableViewHandler_instances.add(this);
    }
    async handleFilters() {
        const { showFilters, saveFiltersKey, filterTypes } = this.getFilterableViewConfig();
        if (showFilters) {
            __classPrivateFieldGet(this, _FilterableViewHandler_instances, "m", _FilterableViewHandler_saveFilters).call(this, saveFiltersKey);
            const filterList = await __classPrivateFieldGet(this, _FilterableViewHandler_instances, "m", _FilterableViewHandler_getFilterList).call(this, saveFiltersKey, ...filterTypes);
            return {
                lists: [filterList.list],
                modelQueryParams: this.getModelQueryParams({
                    ...this.currentView,
                    ...filterList.selection
                })
            };
        }
        return {
            lists: [],
            modelQueryParams: this.getModelQueryParams()
        };
    }
}
exports.default = FilterableViewHandler;
_FilterableViewHandler_instances = new WeakSet(), _FilterableViewHandler_getFilterList = async function _FilterableViewHandler_getFilterList(saveKey, ...filterTypes) {
    const filterSelection = __classPrivateFieldGet(this, _FilterableViewHandler_instances, "m", _FilterableViewHandler_getFilterSelection).call(this, saveKey, ...filterTypes);
    const filterView = {
        ...this.currentView,
        ...filterSelection
    };
    const promises = filterTypes.map((filterType) => {
        switch (filterType) {
            case FilterModel_1.FilterType.AZ:
                const azFilterConfig = ViewHelper_1.default.getFilterModelConfigFromView(filterView, FilterModel_1.FilterType.AZ);
                return azFilterConfig ? this.getModel(model_1.ModelType.AZFilter).getFilter(azFilterConfig) : Promise.resolve(null);
            case FilterModel_1.FilterType.Filter:
                const filterFilterConfig = ViewHelper_1.default.getFilterModelConfigFromView(filterView, FilterModel_1.FilterType.Filter);
                return filterFilterConfig ? this.getModel(model_1.ModelType.FilterFilter).getFilter(filterFilterConfig) : Promise.resolve(null);
            case FilterModel_1.FilterType.Genre:
                const genreFilterConfig = ViewHelper_1.default.getFilterModelConfigFromView(filterView, FilterModel_1.FilterType.Genre);
                return genreFilterConfig ? this.getModel(model_1.ModelType.GenreFilter).getFilter(genreFilterConfig) : Promise.resolve(null);
            case FilterModel_1.FilterType.Sort:
                const sortFilterConfig = ViewHelper_1.default.getFilterModelConfigFromView(filterView, FilterModel_1.FilterType.Sort);
                return sortFilterConfig ? this.getModel(model_1.ModelType.SortFilter).getFilter(sortFilterConfig) : Promise.resolve(null);
            case FilterModel_1.FilterType.Year:
                const yearFilterConfig = ViewHelper_1.default.getFilterModelConfigFromView(filterView, FilterModel_1.FilterType.Year);
                return yearFilterConfig ? this.getModel(model_1.ModelType.YearFilter).getFilter(yearFilterConfig) : Promise.resolve(null);
            default:
                return Promise.resolve(null);
        }
    });
    const filters = await Promise.all(promises);
    const listItems = filters.reduce((result, filter) => {
        if (filter) {
            let title;
            if (filter.subfilters) {
                const subfilterTexts = filter.subfilters.map((f) => __classPrivateFieldGet(this, _FilterableViewHandler_instances, "m", _FilterableViewHandler_getFilterListItemText).call(this, f));
                title = subfilterTexts.join(', ');
            }
            else {
                title = __classPrivateFieldGet(this, _FilterableViewHandler_instances, "m", _FilterableViewHandler_getFilterListItemText).call(this, filter);
            }
            let filterViewName;
            switch (filter.type) {
                case FilterModel_1.FilterType.AZ:
                    filterViewName = 'filter.az';
                    break;
                case FilterModel_1.FilterType.Filter:
                    filterViewName = 'filter.filter';
                    break;
                case FilterModel_1.FilterType.Genre:
                    filterViewName = 'filter.genre';
                    break;
                case FilterModel_1.FilterType.Sort:
                    filterViewName = 'filter.sort';
                    break;
                case FilterModel_1.FilterType.Year:
                default:
                    filterViewName = 'filter.year';
            }
            const filterSelectionView = {
                name: filterViewName,
                filterView: JSON.stringify(filterView)
            };
            result.push({
                service: 'jellyfin',
                type: 'jellyfin-filter',
                title,
                icon: filter.icon,
                uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(filterSelectionView)}`
            });
        }
        return result;
    }, []);
    return {
        list: {
            availableListViews: ['list'],
            items: listItems
        },
        selection: filterView
    };
}, _FilterableViewHandler_getFilterSelection = function _FilterableViewHandler_getFilterSelection(saveKey, ...types) {
    const defaultSelection = __classPrivateFieldGet(this, _FilterableViewHandler_instances, "m", _FilterableViewHandler_getDefaultFilterSelection).call(this, ...types);
    const savedSelection = __classPrivateFieldGet(this, _FilterableViewHandler_instances, "m", _FilterableViewHandler_getSavedFilterSelection).call(this, saveKey);
    const selectionFromView = {};
    const fields = Object.keys(defaultSelection);
    const view = this.currentView;
    fields.forEach((f) => {
        if (view[f] !== undefined) {
            selectionFromView[f] = view[f];
        }
    });
    // Remove fields with undefined values from default selection
    const cleanDefaultSelection = {};
    for (const [field, value] of Object.entries(defaultSelection)) {
        if (value !== undefined) {
            cleanDefaultSelection[field] = value;
        }
        else if (Array.isArray(value)) {
            cleanDefaultSelection[field] = value.join(',');
        }
    }
    return {
        ...cleanDefaultSelection,
        ...savedSelection,
        ...selectionFromView
    };
}, _FilterableViewHandler_getDefaultFilterSelection = async function _FilterableViewHandler_getDefaultFilterSelection(...filterTypes) {
    const promises = filterTypes.map((filterType) => {
        switch (filterType) {
            case FilterModel_1.FilterType.AZ:
                return this.getModel(model_1.ModelType.AZFilter).getDefaultSelection();
            case FilterModel_1.FilterType.Filter:
                return this.getModel(model_1.ModelType.FilterFilter).getDefaultSelection();
            case FilterModel_1.FilterType.Genre:
                return this.getModel(model_1.ModelType.GenreFilter).getDefaultSelection();
            case FilterModel_1.FilterType.Sort:
                switch (this.currentView.name) {
                    case 'albums':
                        return this.getModel(model_1.ModelType.SortFilter).getDefaultSelection(entities_1.EntityType.Album);
                    case 'songs':
                        return this.getModel(model_1.ModelType.SortFilter).getDefaultSelection(entities_1.EntityType.Song);
                    case 'folder':
                        return this.getModel(model_1.ModelType.SortFilter).getDefaultSelection(entities_1.EntityType.Folder);
                    default:
                        return Promise.resolve(null);
                }
            case FilterModel_1.FilterType.Year:
                return this.getModel(model_1.ModelType.YearFilter).getDefaultSelection();
        }
    });
    const filterSelections = await Promise.all(promises);
    const result = {};
    filterSelections.forEach((selection) => {
        if (selection) {
            Object.assign(result, selection);
        }
    });
    return result;
}, _FilterableViewHandler_getSavedFilterSelection = function _FilterableViewHandler_getSavedFilterSelection(key) {
    const remember = JellyfinContext_1.default.getConfigValue('rememberFilters');
    if (remember && this.serverConnection) {
        const savedSelections = JellyfinContext_1.default.getConfigValue('savedFilters');
        if (savedSelections) {
            const fullKey = `${this.serverConnection.id}.${key}`;
            return savedSelections[fullKey] || {};
        }
    }
    return {};
}, _FilterableViewHandler_getFilterListItemText = function _FilterableViewHandler_getFilterListItemText(filter) {
    const selected = filter.options?.filter((o) => o.selected) || [];
    if (selected.length > 0) {
        return selected.map((o) => o.name).join(', ');
    }
    return filter.placeholder;
}, _FilterableViewHandler_saveFilters = function _FilterableViewHandler_saveFilters(key) {
    const remember = JellyfinContext_1.default.getConfigValue('rememberFilters');
    const view = this.currentView;
    if (remember && view.saveFilter && this.serverConnection) {
        const saveFilterData = JSON.parse(view.saveFilter);
        const savedFilters = JellyfinContext_1.default.getConfigValue('savedFilters') || {};
        const fullKey = `${this.serverConnection.id}.${key}`;
        if (!savedFilters[fullKey]) {
            savedFilters[fullKey] = {};
        }
        if (saveFilterData.value != null) {
            savedFilters[fullKey][saveFilterData.field] = saveFilterData.value;
        }
        else {
            delete savedFilters[fullKey][saveFilterData.field];
        }
        JellyfinContext_1.default.setConfigValue('savedFilters', savedFilters);
        JellyfinContext_1.default.getLogger().info('[jellyfin-browse] Filters saved: ', savedFilters);
    }
};
//# sourceMappingURL=FilterableViewHandler.js.map