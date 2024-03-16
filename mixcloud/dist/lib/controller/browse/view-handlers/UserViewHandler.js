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
var _UserViewHandler_instances, _UserViewHandler_browseUser, _UserViewHandler_getLiveStreamList, _UserViewHandler_getShows, _UserViewHandler_getPlaylists, _UserViewHandler_getUserList, _UserViewHandler_browseSearchResults, _UserViewHandler_browseSearchOptions;
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importStar(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
const renderers_1 = require("./renderers");
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class UserViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _UserViewHandler_instances.add(this);
    }
    browse() {
        const view = this.currentView;
        if (view.username) {
            return __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_browseUser).call(this, view.username);
        }
        else if (view.keywords) {
            if (view.select) {
                return __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_browseSearchOptions).call(this, view.select);
            }
            return __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_browseSearchResults).call(this, view.keywords);
        }
        throw Error('Operation not supported');
    }
    async getStreamableEntitiesOnExplode() {
        const view = this.currentView;
        if (!view.username) {
            throw Error('Operation not supported');
        }
        if (view.playTarget === 'liveStream') {
            const liveStream = await this.getModel(model_1.ModelType.LiveStream).getLiveStream(view.username);
            if (!liveStream) {
                return [];
            }
            return liveStream;
        }
        const cloudcastParams = {
            username: view.username,
            limit: MixcloudContext_1.default.getConfigValue('itemsPerPage')
        };
        const cloudcasts = await this.getModel(model_1.ModelType.Cloudcast).getCloudcasts(cloudcastParams);
        return cloudcasts.items;
    }
}
_UserViewHandler_instances = new WeakSet(), _UserViewHandler_browseUser = async function _UserViewHandler_browseUser(username) {
    const [user, liveStreamList, showList, playlistList] = await Promise.all([
        this.getModel(model_1.ModelType.User).getUser(username),
        __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_getLiveStreamList).call(this, username),
        __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_getShows).call(this, username),
        __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_getPlaylists).call(this, username)
    ]);
    const lists = [
        ...liveStreamList,
        ...showList,
        ...playlistList
    ];
    let title = lists[0]?.title || '';
    if (UIHelper_1.default.supportsEnhancedTitles() && user?.url) {
        const firstTitle = title;
        const link = {
            url: user.url,
            text: MixcloudContext_1.default.getI18n('MIXCLOUD_VIEW_LINK_USER', user.name || user.username),
            icon: { type: 'mixcloud' },
            style: UIHelper_1.UI_STYLES.VIEW_LINK,
            target: '_blank'
        };
        title = UIHelper_1.default.constructListTitleWithLink('', link, true);
        if (user.about) {
            title += UIHelper_1.default.wrapInDiv(user.about, UIHelper_1.UI_STYLES.DESCRIPTION);
            title += UIHelper_1.default.wrapInDiv(' ', 'padding-top: 36px;');
        }
        title += firstTitle;
        if (user.about) {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%;');
        }
        else {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
        }
    }
    if (lists.length > 0) {
        lists[0].title = title;
    }
    else {
        lists.push({
            title,
            availableListViews: ['list', 'grid'],
            items: []
        });
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: user ? this.getRenderer(renderers_1.RendererType.User).renderToHeader(user) : undefined,
            lists
        }
    };
}, _UserViewHandler_getLiveStreamList = async function _UserViewHandler_getLiveStreamList(username) {
    const liveStream = await this.getModel(model_1.ModelType.LiveStream).getLiveStream(username);
    if (!liveStream) {
        return [];
    }
    const rendered = this.getRenderer(renderers_1.RendererType.LiveStream).renderToListItem(liveStream, 'playLiveStreamItem');
    if (!rendered) {
        return [];
    }
    let title = MixcloudContext_1.default.getI18n('MIXCLOUD_LIVE_STREAMING_NOW');
    if (UIHelper_1.default.supportsEnhancedTitles() && liveStream.description) {
        title += UIHelper_1.default.wrapInDiv(liveStream.description, UIHelper_1.UI_STYLES.DESCRIPTION);
        if (!liveStream.owner?.about) {
            title += UIHelper_1.default.wrapInDiv(' ', 'padding-top: 18px;');
        }
        title = UIHelper_1.default.wrapInDiv(title, 'width: 100%;');
    }
    return [{
            availableListViews: ['list'],
            title,
            items: [rendered]
        }];
}, _UserViewHandler_getShows = async function _UserViewHandler_getShows(username) {
    const cloudcastView = {
        name: 'cloudcasts',
        username
    };
    const uri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(cloudcastView)}@inSection=1`;
    const handler = ViewHandlerFactory_1.default.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
}, _UserViewHandler_getPlaylists = async function _UserViewHandler_getPlaylists(username) {
    const playlistView = {
        name: 'playlists',
        username
    };
    const uri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(playlistView)}@inSection=1`;
    const handler = ViewHandlerFactory_1.default.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
}, _UserViewHandler_getUserList = function _UserViewHandler_getUserList(users) {
    const renderer = this.getRenderer(renderers_1.RendererType.User);
    const items = users.items.reduce((result, user) => {
        const rendered = renderer.renderToListItem(user);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(users.nextPageToken, users.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        items.push(this.constructNextPageItem(nextUri));
    }
    return {
        availableListViews: ['list', 'grid'],
        items
    };
}, _UserViewHandler_browseSearchResults = async function _UserViewHandler_browseSearchResults(keywords) {
    const view = this.currentView;
    const userParams = {
        keywords,
        limit: view.inSection ? MixcloudContext_1.default.getConfigValue('itemsPerSection') : MixcloudContext_1.default.getConfigValue('itemsPerPage'),
        dateJoined: view.dateJoined,
        userType: view.userType
    };
    if (view.pageRef) {
        userParams.pageToken = view.pageRef.pageToken;
        userParams.pageOffset = view.pageRef.pageOffset;
    }
    const model = this.getModel(model_1.ModelType.User);
    const users = await model.getUsers(userParams);
    const lists = [];
    const optionList = await this.getOptionList({
        getOptionBundle: async () => model.getSearchOptions(),
        currentSelected: users.params,
        showOptionName: () => true
    });
    if (optionList) {
        lists.push(optionList);
    }
    lists.push(__classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_getUserList).call(this, users));
    let title;
    if (view.inSection) {
        title = MixcloudContext_1.default.getI18n(UIHelper_1.default.supportsEnhancedTitles() ? 'MIXCLOUD_USERS' : 'MIXCLOUD_USERS_FULL');
    }
    else {
        title = MixcloudContext_1.default.getI18n(UIHelper_1.default.supportsEnhancedTitles() ? 'MIXCLOUD_USERS_MATCHING' : 'MIXCLOUD_USERS_MATCHING_FULL', keywords);
    }
    lists[0].title = UIHelper_1.default.addMixcloudIconToListTitle(title);
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _UserViewHandler_browseSearchOptions = function _UserViewHandler_browseSearchOptions(option) {
    return this.browseOptionValues({
        getOptionBundle: async () => this.getModel(model_1.ModelType.User).getSearchOptions(),
        targetOption: option
    });
};
exports.default = UserViewHandler;
//# sourceMappingURL=UserViewHandler.js.map