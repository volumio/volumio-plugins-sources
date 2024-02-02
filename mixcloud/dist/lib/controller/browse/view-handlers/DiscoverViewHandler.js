"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _DiscoverViewHandler_instances, _DiscoverViewHandler_browseDiscoverResults, _DiscoverViewHandler_browseDiscoverOptions;
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class DiscoverViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _DiscoverViewHandler_instances.add(this);
    }
    browse() {
        const view = this.currentView;
        if (view.select) {
            return __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_browseDiscoverOptions).call(this, view.select);
        }
        return __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_browseDiscoverResults).call(this);
    }
    getListType() {
        return 'all';
    }
    getSwitchViewLinkData(selectedTags) {
        // "View featured { tag } shows"
        const featuredView = {
            name: 'featured',
            slug: selectedTags[0].slug
        };
        const tagNames = selectedTags.map((t) => t.name).join(' &amp; ');
        return {
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(featuredView)}`,
            text: MixcloudContext_1.default.getI18n('MIXCLOUD_VIEW_FEATURED_SHOWS', tagNames)
        };
    }
    getTitle(selectedTags = [], orderBy, country) {
        const tagNames = selectedTags.map((t) => t.name).join(' &amp; ');
        const countryName = country ? `(${country})` : '';
        let i18nKey = 'MIXCLOUD_DISCOVER_TITLE';
        switch (orderBy) {
            case 'trending':
                i18nKey += '_TRENDING';
                break;
            case 'popular':
                i18nKey += '_POPULAR';
                break;
            case 'latest':
                i18nKey += '_LATEST';
                break;
        }
        const title = MixcloudContext_1.default.getI18n(i18nKey, tagNames, countryName);
        const featuredLinkData = this.getSwitchViewLinkData(selectedTags);
        const featuredLink = this.constructGoToViewLink(featuredLinkData.text, featuredLinkData.uri);
        return UIHelper_1.default.constructListTitleWithLink(title, featuredLink, true);
    }
    getDiscoverModelParams() {
        const view = this.currentView;
        const params = {
            list: this.getListType(),
            slug: view.slug,
            limit: view.inSection ? MixcloudContext_1.default.getConfigValue('itemsPerSection') : MixcloudContext_1.default.getConfigValue('itemsPerPage')
        };
        if (view.orderBy) {
            params.orderBy = view.orderBy;
        }
        // 'country' only available with 'all' discovery results and 'orderBy: trending'
        if (this.getListType() === 'all' && params.orderBy === 'trending' && view.country) {
            params.country = view.country;
        }
        if (view.pageRef) {
            params.pageToken = view.pageRef.pageToken;
            params.pageOffset = view.pageRef.pageOffset;
        }
        return params;
    }
    async getStreamableEntitiesOnExplode() {
        const cloudcasts = await this.getModel(model_1.ModelType.Discover)
            .getDiscoverResults(this.getDiscoverModelParams());
        return cloudcasts.items;
    }
}
_DiscoverViewHandler_instances = new WeakSet(), _DiscoverViewHandler_browseDiscoverResults = async function _DiscoverViewHandler_browseDiscoverResults() {
    const view = this.currentView;
    const lists = [];
    const model = this.getModel(model_1.ModelType.Discover);
    const discoverParams = this.getDiscoverModelParams();
    const cloudcasts = await model.getDiscoverResults(discoverParams);
    const discoverOptions = await model.getDiscoverOptions({
        list: this.getListType(),
        orderBy: cloudcasts.params.orderBy
    });
    // Sanitize getOptionList() params
    const currentSelected = {
        ...cloudcasts.params
    };
    const selectedTags = cloudcasts.selectedTags;
    const ensureSlug = {
        name: selectedTags.length > 0 ?
            selectedTags.map((tag) => tag.name).join(', ') :
            MixcloudContext_1.default.getI18n('MIXCLOUD_ALL_CATEGORIES'),
        value: selectedTags.map((tag) => tag.slug).join('-')
    };
    currentSelected.slug = ensureSlug.value;
    if (!discoverOptions.slug.values.some((s) => s.value === ensureSlug.value)) {
        discoverOptions.slug.values.push(ensureSlug);
    }
    const optionList = await this.getOptionList({
        getOptionBundle: async () => discoverOptions,
        currentSelected
    });
    if (optionList) {
        lists.push(optionList);
    }
    lists.push(this.getCloudcastList(cloudcasts, true));
    let currentCountry;
    if (this.getListType() === 'all') {
        const _params = cloudcasts.params;
        currentCountry = discoverOptions.country.values.find((c) => c.value === _params.country)?.name;
    }
    lists[0].title = UIHelper_1.default.addMixcloudIconToListTitle(this.getTitle(cloudcasts.selectedTags, cloudcasts.params.orderBy, currentCountry));
    if (!UIHelper_1.default.supportsEnhancedTitles() && !view.inSection && cloudcasts.selectedTags.length > 0) {
        // Compensate for loss of switch view link
        const switchViewLinkData = this.getSwitchViewLinkData(cloudcasts.selectedTags);
        const switchViewListItem = {
            service: 'mixcloud',
            type: 'item-no-menu',
            title: switchViewLinkData.text,
            uri: switchViewLinkData.uri,
            icon: 'fa fa-arrow-circle-right'
        };
        lists.push({
            availableListViews: ['list'],
            items: [switchViewListItem]
        });
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _DiscoverViewHandler_browseDiscoverOptions = function _DiscoverViewHandler_browseDiscoverOptions(option) {
    return this.browseOptionValues({
        getOptionBundle: () => this.getModel(model_1.ModelType.Discover).getDiscoverOptions({
            list: this.getListType(),
            orderBy: this.currentView.orderBy
        }),
        targetOption: option
    });
};
exports.default = DiscoverViewHandler;
//# sourceMappingURL=DiscoverViewHandler.js.map