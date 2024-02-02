"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _CloudcastViewHandler_instances, _CloudcastViewHandler_browseCloudcast, _CloudcastViewHandler_browseUserShows, _CloudcastViewHandler_browseUserShowOptionValues, _CloudcastViewHandler_browseSearchOptionValues, _CloudcastViewHandler_browsePlaylistItems, _CloudcastViewHandler_browseSearchResults;
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importStar(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class CloudcastViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _CloudcastViewHandler_instances.add(this);
    }
    async browse() {
        const view = this.currentView;
        if (view.cloudcastId) {
            return __classPrivateFieldGet(this, _CloudcastViewHandler_instances, "m", _CloudcastViewHandler_browseCloudcast).call(this, view.cloudcastId);
        }
        else if (view.username) {
            if (view.select) {
                return __classPrivateFieldGet(this, _CloudcastViewHandler_instances, "m", _CloudcastViewHandler_browseUserShowOptionValues).call(this, view.select);
            }
            return __classPrivateFieldGet(this, _CloudcastViewHandler_instances, "m", _CloudcastViewHandler_browseUserShows).call(this, view.username);
        }
        else if (view.playlistId) {
            return __classPrivateFieldGet(this, _CloudcastViewHandler_instances, "m", _CloudcastViewHandler_browsePlaylistItems).call(this, view.playlistId);
        }
        else if (view.keywords) {
            if (view.select) {
                return __classPrivateFieldGet(this, _CloudcastViewHandler_instances, "m", _CloudcastViewHandler_browseSearchOptionValues).call(this, view.select);
            }
            return __classPrivateFieldGet(this, _CloudcastViewHandler_instances, "m", _CloudcastViewHandler_browseSearchResults).call(this, view.keywords);
        }
        throw Error('Operation not supported');
    }
    async getStreamableEntitiesOnExplode() {
        const view = this.currentView;
        const model = this.getModel(model_1.ModelType.Cloudcast);
        if (view.cloudcastId) {
            const cloudcast = await model.getCloudcast(view.cloudcastId);
            return cloudcast || [];
        }
        else if (view.username) {
            const cloudcastParams = {
                username: view.username,
                limit: MixcloudContext_1.default.getConfigValue('itemsPerPage')
            };
            if (view.pageRef) {
                cloudcastParams.pageToken = view.pageRef.pageToken;
                cloudcastParams.pageOffset = view.pageRef.pageOffset;
            }
            if (view.orderBy !== undefined) {
                cloudcastParams.orderBy = view.orderBy;
            }
            const cloudcasts = await model.getCloudcasts(cloudcastParams);
            return cloudcasts.items;
        }
        else if (view.playlistId) {
            const cloudcastParams = {
                playlistId: view.playlistId,
                limit: MixcloudContext_1.default.getConfigValue('itemsPerPage')
            };
            if (view.pageRef) {
                cloudcastParams.pageToken = view.pageRef.pageToken;
                cloudcastParams.pageOffset = view.pageRef.pageOffset;
            }
            const cloudcasts = await model.getCloudcasts(cloudcastParams);
            return cloudcasts.items;
        }
        throw Error('Operation not supported');
    }
}
_CloudcastViewHandler_instances = new WeakSet(), _CloudcastViewHandler_browseCloudcast = async function _CloudcastViewHandler_browseCloudcast(cloudcastId) {
    const view = this.currentView;
    const model = this.getModel(model_1.ModelType.Cloudcast);
    const renderer = this.getRenderer(renderers_1.RendererType.Cloudcast);
    const cloudcast = await model.getCloudcast(cloudcastId);
    if (!cloudcast) {
        throw Error('Cloudcast does not exist!');
    }
    const lists = [];
    const playShowItem = renderer.renderToListItem(cloudcast, 'playShowItem');
    if (playShowItem) {
        lists.push({
            availableListViews: ['list'],
            items: [playShowItem]
        });
    }
    if (view.showMoreFromUser && cloudcast.owner) {
        const userView = {
            name: 'user',
            username: cloudcast.owner.username
        };
        const moreFromUserItem = {
            service: 'mixcloud',
            type: 'item-no-menu',
            title: MixcloudContext_1.default.getI18n('MIXCLOUD_MORE_FROM', cloudcast.owner.name || cloudcast.owner.username),
            icon: 'fa fa-arrow-right',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(userView)}@noExplode=1`
        };
        lists.push({
            availableListViews: ['list'],
            items: [moreFromUserItem]
        });
    }
    if (UIHelper_1.default.supportsEnhancedTitles() && cloudcast.url && lists.length > 0) {
        let title = '';
        const link = {
            url: cloudcast.url,
            text: MixcloudContext_1.default.getI18n('MIXCLOUD_VIEW_LINK_SHOW'),
            icon: { type: 'mixcloud' },
            style: UIHelper_1.UI_STYLES.VIEW_LINK,
            target: '_blank'
        };
        title = UIHelper_1.default.constructListTitleWithLink('', link, true);
        if (cloudcast.description) {
            title += UIHelper_1.default.wrapInDiv(cloudcast.description, UIHelper_1.UI_STYLES.DESCRIPTION);
        }
        if (cloudcast.description) {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%;');
        }
        else {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
        }
        lists[0].title = title;
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: renderer.renderToHeader(cloudcast),
            lists
        }
    };
}, _CloudcastViewHandler_browseUserShows = async function _CloudcastViewHandler_browseUserShows(username) {
    const view = this.currentView;
    const cloudcastParams = {
        username: username,
        limit: view.inSection ? MixcloudContext_1.default.getConfigValue('itemsPerSection') : MixcloudContext_1.default.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
        cloudcastParams.pageToken = view.pageRef.pageToken;
        cloudcastParams.pageOffset = view.pageRef.pageOffset;
    }
    if (view.orderBy) {
        cloudcastParams.orderBy = view.orderBy;
    }
    const userModel = this.getModel(model_1.ModelType.User);
    const cloudcastModel = this.getModel(model_1.ModelType.Cloudcast);
    const [cloudcasts, user] = await Promise.all([
        cloudcastModel.getCloudcasts(cloudcastParams),
        userModel.getUser(username)
    ]);
    const lists = [];
    if (cloudcasts.items.length > 0) {
        const optionList = await this.getOptionList({
            getOptionBundle: async () => userModel.getShowsOptions(),
            currentSelected: cloudcasts.params
        });
        if (optionList) {
            lists.push(optionList);
        }
        lists.push(this.getCloudcastList(cloudcasts));
        lists[0].title = MixcloudContext_1.default.getI18n('MIXCLOUD_SHOWS');
        if (!this.currentView.inSection) {
            const backLink = this.constructPrevViewLink(MixcloudContext_1.default.getI18n('MIXCLOUD_BACK_LINK_USER'));
            lists[0].title = UIHelper_1.default.constructListTitleWithLink(lists[0].title, backLink, true);
        }
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: user ? this.getRenderer(renderers_1.RendererType.User).renderToHeader(user) : undefined,
            lists
        }
    };
}, _CloudcastViewHandler_browseUserShowOptionValues = async function _CloudcastViewHandler_browseUserShowOptionValues(option) {
    return this.browseOptionValues({
        getOptionBundle: async () => this.getModel(model_1.ModelType.User).getShowsOptions(),
        targetOption: option
    });
}, _CloudcastViewHandler_browseSearchOptionValues = async function _CloudcastViewHandler_browseSearchOptionValues(option) {
    return this.browseOptionValues({
        getOptionBundle: async () => this.getModel(model_1.ModelType.Cloudcast).getSearchOptions(),
        targetOption: option
    });
}, _CloudcastViewHandler_browsePlaylistItems = async function _CloudcastViewHandler_browsePlaylistItems(playlistId) {
    const view = this.currentView;
    const cloudcastParams = {
        playlistId,
        limit: view.inSection ? MixcloudContext_1.default.getConfigValue('itemsPerSection') : MixcloudContext_1.default.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
        cloudcastParams.pageToken = view.pageRef.pageToken;
        cloudcastParams.pageOffset = view.pageRef.pageOffset;
    }
    const playlistModel = this.getModel(model_1.ModelType.Playlist);
    const cloudcastModel = this.getModel(model_1.ModelType.Cloudcast);
    const [cloudcasts, playlist] = await Promise.all([
        cloudcastModel.getCloudcasts(cloudcastParams),
        playlistModel.getPlaylist(playlistId)
    ]);
    const lists = [this.getCloudcastList(cloudcasts)];
    if (UIHelper_1.default.supportsEnhancedTitles() && playlist?.url) {
        let title = '';
        const link = {
            url: playlist.url,
            text: MixcloudContext_1.default.getI18n('MIXCLOUD_VIEW_LINK_PLAYLIST'),
            icon: { type: 'mixcloud' },
            style: UIHelper_1.UI_STYLES.VIEW_LINK,
            target: '_blank'
        };
        title = UIHelper_1.default.constructListTitleWithLink('', link, true);
        if (playlist.description) {
            title += UIHelper_1.default.wrapInDiv(playlist.description, UIHelper_1.UI_STYLES.DESCRIPTION);
        }
        if (playlist.description) {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%;');
        }
        else {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
        }
        lists[0].title = title;
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: playlist ? this.getRenderer(renderers_1.RendererType.Playlist).renderToHeader(playlist) : undefined,
            lists
        }
    };
}, _CloudcastViewHandler_browseSearchResults = async function _CloudcastViewHandler_browseSearchResults(keywords) {
    const view = this.currentView;
    const cloudcastParams = {
        keywords,
        limit: view.inSection ? MixcloudContext_1.default.getConfigValue('itemsPerSection') : MixcloudContext_1.default.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
        cloudcastParams.pageToken = view.pageRef.pageToken;
        cloudcastParams.pageOffset = view.pageRef.pageOffset;
    }
    if (view.dateUploaded !== undefined) {
        cloudcastParams.dateUploaded = view.dateUploaded;
    }
    const model = this.getModel(model_1.ModelType.Cloudcast);
    const cloudcasts = await model.getCloudcasts(cloudcastParams);
    const lists = [];
    const optionList = await this.getOptionList({
        getOptionBundle: async () => model.getSearchOptions(),
        currentSelected: cloudcasts.params,
        showOptionName: () => true
    });
    if (optionList) {
        lists.push(optionList);
    }
    lists.push(this.getCloudcastList(cloudcasts, true));
    let title;
    if (view.inSection) {
        title = MixcloudContext_1.default.getI18n(UIHelper_1.default.supportsEnhancedTitles() ? 'MIXCLOUD_SHOWS' : 'MIXCLOUD_SHOWS_FULL');
    }
    else {
        title = MixcloudContext_1.default.getI18n(UIHelper_1.default.supportsEnhancedTitles() ? 'MIXCLOUD_SHOWS_MATCHING' : 'MIXCLOUD_SHOWS_MATCHING_FULL', keywords);
    }
    lists[0].title = UIHelper_1.default.addMixcloudIconToListTitle(title);
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
};
exports.default = CloudcastViewHandler;
//# sourceMappingURL=CloudcastViewHandler.js.map