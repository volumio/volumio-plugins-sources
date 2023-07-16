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
var _ArticleViewHandler_instances, _ArticleViewHandler_browseList, _ArticleViewHandler_getCategoryFromUriOrDefault, _ArticleViewHandler_findCategoryInSections, _ArticleViewHandler_getParamsList, _ArticleViewHandler_getArticleList, _ArticleViewHandler_browseCategories, _ArticleViewHandler_getArticleCategoryListPerSection, _ArticleViewHandler_constructArticleCategoryUri, _ArticleViewHandler_browseArticle, _ArticleViewHandler_getArticleSectionLists, _ArticleViewHandler_formatArticleText, _ArticleViewHandler_getGoToMediaItemLink;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importStar(require("../../../util/UIHelper"));
const renderers_1 = require("./renderers");
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ARTICLE_CATEGORY_ALL = {
    url: 'all',
    name: 'All categories'
};
class ArticleViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _ArticleViewHandler_instances.add(this);
    }
    browse() {
        const view = this.currentView;
        if (view.articleUrl) {
            return __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_browseArticle).call(this, view.articleUrl);
        }
        else if (view.select) {
            return __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_browseCategories).call(this);
        }
        return __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_browseList).call(this);
    }
    async getTracksOnExplode() {
        const articleUrl = this.currentView.articleUrl;
        if (!articleUrl) {
            throw Error('No article URL specified');
        }
        const _setTrackProps = (track, article, mediaItem) => {
            const result = {
                ...track,
                articleUrl: article.url,
                mediaItemRef: mediaItem.mediaItemRef
            };
            // Set props so track can be parsed
            result.thumbnail = mediaItem.thumbnail;
            delete result.artist;
            if (mediaItem.artist) {
                result.artist = mediaItem.artist;
            }
            if (mediaItem.type === 'album') {
                result.album = {
                    type: 'album',
                    name: mediaItem.name,
                    url: mediaItem.url
                };
            }
            return result;
        };
        const article = await this.getModel(model_1.ModelType.Article).getArticle(articleUrl);
        const { mediaItemRef, track } = this.currentView;
        if (mediaItemRef && track) {
            const trackPosition = parseInt(track, 10);
            // Return track corresponding to mediaItemRef and track position
            const mediaItem = article.mediaItems?.find((mi) => mi.mediaItemRef === mediaItemRef);
            if (mediaItem?.type === 'album') {
                const track = mediaItem.tracks?.find((tr) => tr.position === trackPosition);
                if (track) {
                    return _setTrackProps(track, article, mediaItem);
                }
            }
            // Not found
            return [];
        }
        // Return all featured tracks
        const tracks = article.mediaItems?.reduce((result, mediaItem) => {
            let track;
            if (mediaItem.type === 'album') {
                track = mediaItem.tracks?.find((tr) => tr.position == mediaItem.featuredTrackPosition);
            }
            else if (mediaItem.type === 'track') {
                track = mediaItem;
            }
            if (track) {
                result.push(_setTrackProps(track, article, mediaItem));
            }
            return result;
        }, []);
        return tracks || [];
    }
    /**
     * Override
     *
     * Track uri:
     * bandcamp/articles@articleUrl={articleUrl}@mediaItemRef={...}@track={trackPosition}@artistUrl={...}@albumUrl={...}
     */
    getTrackUri(track) {
        const artistUrl = track.artist?.url || null;
        const albumUrl = track.album?.url || artistUrl;
        const articleView = {
            name: 'article',
            articleUrl: track.articleUrl,
            mediaItemRef: track.mediaItemRef,
            track: track.position?.toString()
        };
        if (artistUrl) {
            articleView.artistUrl = artistUrl;
        }
        if (albumUrl) {
            articleView.albumUrl = albumUrl;
        }
        const uri = `bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(articleView)}`;
        return uri;
    }
}
exports.default = ArticleViewHandler;
_ArticleViewHandler_instances = new WeakSet(), _ArticleViewHandler_browseList = async function _ArticleViewHandler_browseList() {
    const category = await __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getCategoryFromUriOrDefault).call(this);
    if (!category.url) {
        throw Error('Category URL missing');
    }
    const lists = [__classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getParamsList).call(this, category)];
    const articleList = await __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getArticleList).call(this, category.url);
    lists.push(articleList);
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _ArticleViewHandler_getCategoryFromUriOrDefault = async function _ArticleViewHandler_getCategoryFromUriOrDefault() {
    const categoryUrl = this.currentView.categoryUrl;
    if (categoryUrl === ARTICLE_CATEGORY_ALL.url) {
        return ARTICLE_CATEGORY_ALL;
    }
    if (categoryUrl) {
        const categorySections = await this.getModel(model_1.ModelType.Article).getArticleCategories();
        const category = __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_findCategoryInSections).call(this, categoryUrl, categorySections);
        if (category) {
            return category;
        }
    }
    return BandcampContext_1.default.getConfigValue('defaultArticleCategory', ARTICLE_CATEGORY_ALL, true);
}, _ArticleViewHandler_findCategoryInSections = function _ArticleViewHandler_findCategoryInSections(categoryUrl, sections) {
    for (const section of sections) {
        if (section.sections) {
            const result = __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_findCategoryInSections).call(this, categoryUrl, section.sections);
            if (result) {
                return result;
            }
        }
        else if (section.categories) {
            const result = section.categories.find((category) => category.url === categoryUrl);
            if (result) {
                return result;
            }
        }
    }
    return null;
}, _ArticleViewHandler_getParamsList = function _ArticleViewHandler_getParamsList(category) {
    const setDefaultJS = `
                const params = ${JSON.stringify(category)};
                const payload = {
                    'endpoint': 'music_service/bandcamp',
                    'method': 'saveDefaultArticleCategory',
                    'data': params
                };
                angular.element('#browse-page').scope().browse.socketService.emit('callMethod', payload);`;
    const setDefaultLink = {
        url: '#',
        icon: { type: 'fa', class: 'fa fa-cog' },
        text: BandcampContext_1.default.getI18n('BANDCAMP_SET_DEFAULT_ARTICLE_CATEGORY'),
        onclick: setDefaultJS.replace(/"/g, '&quot;').replace(/\r?\n|\r/g, '')
    };
    const title = UIHelper_1.default.constructListTitleWithLink(UIHelper_1.default.addBandcampIconToListTitle(BandcampContext_1.default.getI18n('BANDCAMP_DAILY')), setDefaultLink, true);
    const paramsList = {
        title,
        availableListViews: ['list'],
        items: []
    };
    const categoryName = category.url !== ARTICLE_CATEGORY_ALL.url ? category.name : BandcampContext_1.default.getI18n('BANDCAMP_ALL_CATEGORIES');
    paramsList.items.push({
        service: 'bandcamp',
        type: 'item-no-menu',
        title: categoryName,
        icon: 'fa fa-filter',
        uri: `${this.uri}@select=category`
    });
    return paramsList;
}, _ArticleViewHandler_getArticleList = async function _ArticleViewHandler_getArticleList(categoryUrl) {
    const view = this.currentView;
    const modelParams = {
        limit: view.inSection ? BandcampContext_1.default.getConfigValue('itemsPerSection', 5) : BandcampContext_1.default.getConfigValue('itemsPerPage', 47)
    };
    if (view.pageRef) {
        modelParams.pageToken = view.pageRef.pageToken;
        modelParams.pageOffset = view.pageRef.pageOffset;
    }
    if (categoryUrl !== ARTICLE_CATEGORY_ALL.url) {
        modelParams.categoryUrl = categoryUrl;
    }
    const articleList = await this.getModel(model_1.ModelType.Article).getArticles(modelParams);
    const articleRenderer = this.getRenderer(renderers_1.RendererType.Article);
    const listItems = articleList.items.reduce((result, article) => {
        const rendered = articleRenderer.renderToListItem(article);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(articleList.nextPageToken, articleList.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        listItems.push(this.constructNextPageItem(nextUri));
    }
    return {
        availableListViews: ['list', 'grid'],
        items: listItems
    };
}, _ArticleViewHandler_browseCategories = async function _ArticleViewHandler_browseCategories() {
    const currentCategory = await __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getCategoryFromUriOrDefault).call(this);
    const firstList = {
        title: UIHelper_1.default.addIconToListTitle('fa fa-filter', BandcampContext_1.default.getI18n('BANDCAMP_ARTICLE_CATEGORIES')),
        availableListViews: ['list'],
        items: []
    };
    let allCategoriesTitle = BandcampContext_1.default.getI18n('BANDCAMP_ALL_CATEGORIES');
    const isAllCategories = currentCategory.url === ARTICLE_CATEGORY_ALL.url;
    if (isAllCategories) {
        allCategoriesTitle = UIHelper_1.default.styleText(allCategoriesTitle, UIHelper_1.UI_STYLES.LIST_ITEM_SELECTED);
    }
    firstList.items.push({
        service: 'bandcamp',
        type: 'item-no-menu',
        title: allCategoriesTitle,
        icon: isAllCategories ? 'fa fa-check' : 'fa',
        uri: __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_constructArticleCategoryUri).call(this, ARTICLE_CATEGORY_ALL.url)
    });
    const categorySections = await this.getModel(model_1.ModelType.Article).getArticleCategories();
    const lists = __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getArticleCategoryListPerSection).call(this, categorySections, currentCategory);
    lists.unshift(firstList);
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _ArticleViewHandler_getArticleCategoryListPerSection = function _ArticleViewHandler_getArticleCategoryListPerSection(sections, currentCategory, lists = []) {
    sections.forEach((section) => {
        if (section.sections) {
            __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getArticleCategoryListPerSection).call(this, section.sections, currentCategory, lists);
        }
        else if (section.categories) {
            const categoryList = {
                title: section.title,
                availableListViews: ['list'],
                items: []
            };
            section.categories.forEach((category) => {
                if (category.url) {
                    const isSelected = currentCategory ? currentCategory.url === category.url : false;
                    let title = category.name;
                    if (isSelected) {
                        title = UIHelper_1.default.styleText(title, UIHelper_1.UI_STYLES.LIST_ITEM_SELECTED);
                    }
                    categoryList.items.push({
                        service: 'bandcamp',
                        type: 'item-no-menu',
                        title,
                        icon: isSelected ? 'fa fa-check' : 'fa',
                        uri: __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_constructArticleCategoryUri).call(this, category.url)
                    });
                }
            });
            lists.push(categoryList);
        }
    });
    return lists;
}, _ArticleViewHandler_constructArticleCategoryUri = function _ArticleViewHandler_constructArticleCategoryUri(categoryUrl) {
    const targetView = { ...this.currentView };
    if (targetView.categoryUrl !== categoryUrl) {
        delete targetView.pageRef;
        delete targetView.prevPageRefs;
        if (categoryUrl) {
            targetView.categoryUrl = categoryUrl;
        }
        else {
            delete targetView.categoryUrl;
        }
    }
    delete targetView.select;
    return ViewHelper_1.default.constructUriFromViews([...this.previousViews, targetView]);
}, _ArticleViewHandler_browseArticle = async function _ArticleViewHandler_browseArticle(articleUrl) {
    const article = await this.getModel(model_1.ModelType.Article).getArticle(articleUrl);
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: this.getRenderer(renderers_1.RendererType.Article).renderToHeader(article),
            lists: __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getArticleSectionLists).call(this, article)
        }
    };
}, _ArticleViewHandler_getArticleSectionLists = function _ArticleViewHandler_getArticleSectionLists(article) {
    // Each 'list' in Volumio contains the article section's text,
    // As well as the track featured in the next section (if any).
    // If the article covers a single media item (album / track) and
    // There is no nextSection, then all tracks will be shown instead
    // Of just the featured track.
    const articleRenderer = this.getRenderer(renderers_1.RendererType.Article);
    const isSingleMediaItem = article.mediaItems?.length === 1;
    const lists = [];
    article.sections?.forEach((section, sectionIndex, allSections) => {
        const nextSection = allSections[sectionIndex + 1];
        let listItems = [];
        let title = '';
        // First section has 'View on Bandcamp' link
        if (sectionIndex === 0) {
            const viewArticleLink = {
                url: article.url,
                text: BandcampContext_1.default.getI18n('BANDCAMP_VIEW_LINK_ARTICLE'),
                icon: { type: 'bandcamp' },
                target: '_blank'
            };
            title = UIHelper_1.default.constructListTitleWithLink('', viewArticleLink, true);
        }
        // Section text
        title += UIHelper_1.default.wrapInDiv(__classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_formatArticleText).call(this, section.text), UIHelper_1.UI_STYLES.ARTICLE_SECTION.TEXT);
        // Next section's featured track (or all tracks if single media item)
        if (isSingleMediaItem && !nextSection) {
            const album = article.mediaItems?.find((mi) => mi.type === 'album');
            if (album) {
                let albumTitle = '';
                if (album.artist) {
                    albumTitle = `${UIHelper_1.default.styleText(album.artist.name, UIHelper_1.UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_ARTIST)}<br/>`;
                }
                albumTitle += UIHelper_1.default.styleText(album.name, UIHelper_1.UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_NAME);
                const gotoLink = __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getGoToMediaItemLink).call(this, album);
                if (gotoLink) {
                    let titleWithGoto = UIHelper_1.default.constructListTitleWithLink(albumTitle, gotoLink, true);
                    titleWithGoto = UIHelper_1.default.wrapInDiv(titleWithGoto, 'position: relative; top: 18px;');
                    title += titleWithGoto;
                }
                listItems = album.tracks?.map((track) => articleRenderer.renderMediaItemTrack(article, album, track)) || [];
            }
        }
        else if (nextSection?.mediaItemRef) {
            const mediaItem = article.mediaItems?.find((mi) => mi.mediaItemRef === nextSection.mediaItemRef);
            if (mediaItem) {
                let featuredTrack;
                if (mediaItem.type === 'album') {
                    const album = mediaItem;
                    featuredTrack = album.tracks?.find((tr) => tr.position == album.featuredTrackPosition);
                }
                if (mediaItem.type === 'track') {
                    featuredTrack = mediaItem;
                }
                if (featuredTrack) {
                    let mediaItemTitle = '';
                    if (nextSection.heading) {
                        if (mediaItem.artist) {
                            mediaItemTitle = `${UIHelper_1.default.styleText(mediaItem.artist.name, UIHelper_1.UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_ARTIST)}<br/>`;
                        }
                        mediaItemTitle += UIHelper_1.default.styleText(mediaItem.name, UIHelper_1.UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_NAME);
                    }
                    const gotoLink = __classPrivateFieldGet(this, _ArticleViewHandler_instances, "m", _ArticleViewHandler_getGoToMediaItemLink).call(this, mediaItem);
                    if (gotoLink) {
                        let titleWithGoto = UIHelper_1.default.constructListTitleWithLink(mediaItemTitle, gotoLink, true);
                        if (!nextSection.heading) {
                            titleWithGoto = UIHelper_1.default.wrapInDiv(titleWithGoto, 'position: relative; top: 28px;');
                        }
                        else {
                            titleWithGoto = UIHelper_1.default.wrapInDiv(titleWithGoto, 'position: relative; top: 18px;');
                        }
                        title += titleWithGoto;
                    }
                    listItems.push(articleRenderer.renderMediaItemTrack(article, mediaItem, featuredTrack));
                }
            }
        }
        if (sectionIndex > 0) {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%; margin-top: -48px;');
        }
        else {
            title = UIHelper_1.default.wrapInDiv(title, 'width: 100%;');
        }
        if (!UIHelper_1.default.supportsEnhancedTitles()) {
            title = BandcampContext_1.default.getI18n('BANDCAMP_UI_CONTENT_HIDDEN');
        }
        lists.push({
            title,
            availableListViews: ['list'],
            items: listItems
        });
    });
    if (article.category?.url) {
        const articleView = {
            name: 'article',
            categoryUrl: article.category.url
        };
        const moreUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(articleView)}`;
        const moreItem = {
            service: 'bandcamp',
            type: 'item-no-menu',
            'title': BandcampContext_1.default.getI18n('BANDCAMP_MORE_CATEGORY_ARTICLES', article.category.name),
            'uri': `${moreUri}@noExplode=1`,
            'icon': 'fa fa-arrow-circle-right'
        };
        const last = lists[lists.length - 1];
        if (last?.items?.length === 0) {
            last.items.push(moreItem);
        }
        else {
            lists.push({
                availableListViews: ['list'],
                items: [moreItem]
            });
        }
    }
    return lists;
}, _ArticleViewHandler_formatArticleText = function _ArticleViewHandler_formatArticleText(s) {
    return s.replace(/(?:\r\n|\r|\n)/g, '<br/>');
}, _ArticleViewHandler_getGoToMediaItemLink = function _ArticleViewHandler_getGoToMediaItemLink(mediaItem) {
    if (!mediaItem.url) {
        return null;
    }
    let gotoView;
    if (mediaItem.type === 'album') {
        gotoView = {
            name: 'album',
            albumUrl: mediaItem.url
        };
    }
    else {
        gotoView = {
            name: 'track',
            trackUrl: mediaItem.url
        };
    }
    const gotoPath = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(gotoView)}`;
    const gotoText = mediaItem.type === 'album' ? BandcampContext_1.default.getI18n('BANDCAMP_GO_TO_ALBUM') : BandcampContext_1.default.getI18n('BANDCAMP_GO_TO_TRACK');
    return {
        url: '#',
        text: gotoText,
        onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${gotoPath}'})`,
        icon: {
            type: 'fa',
            class: 'fa fa-arrow-circle-right',
            float: 'right',
            color: '#54c688'
        }
    };
};
//# sourceMappingURL=ArticleViewHandler.js.map