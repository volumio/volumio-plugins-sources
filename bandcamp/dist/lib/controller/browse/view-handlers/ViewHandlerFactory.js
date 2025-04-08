"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AlbumViewHandler_1 = __importDefault(require("./AlbumViewHandler"));
const ArticleViewHandler_1 = __importDefault(require("./ArticleViewHandler"));
const BandViewHandler_1 = __importDefault(require("./BandViewHandler"));
const DiscoverViewHandler_1 = __importDefault(require("./DiscoverViewHandler"));
const FanViewHandler_1 = __importDefault(require("./FanViewHandler"));
const RootViewHandler_1 = __importDefault(require("./RootViewHandler"));
const SearchViewHandler_1 = __importDefault(require("./SearchViewHandler"));
const ShowViewHandler_1 = __importDefault(require("./ShowViewHandler"));
const TagViewHandler_1 = __importDefault(require("./TagViewHandler"));
const TrackViewHandler_1 = __importDefault(require("./TrackViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const VIEW_NAME_TO_CLASS = {
    'root': RootViewHandler_1.default,
    'discover': DiscoverViewHandler_1.default,
    'band': BandViewHandler_1.default,
    'album': AlbumViewHandler_1.default,
    'track': TrackViewHandler_1.default,
    'search': SearchViewHandler_1.default,
    'show': ShowViewHandler_1.default,
    'article': ArticleViewHandler_1.default,
    'tag': TagViewHandler_1.default,
    'fan': FanViewHandler_1.default
};
class ViewHandlerFactory {
    static getHandler(uri) {
        const views = ViewHelper_1.default.getViewsFromUri(uri);
        const currentView = views.pop();
        const previousViews = views;
        if (!currentView) {
            throw Error('Invalid URI: no parseable view.');
        }
        /**
         * 'artist' and 'label' views are obsolete (replaced by single 'band' view),
         * but may still exist in Volumio playlists or favourites. We still want to be able
         * to play them, so we translate these URIs into their 'band' equivalent.
         */
        if (currentView.name === 'artist' || currentView.name === 'label') {
            currentView.name = 'band';
            if (currentView.artistUrl) {
                currentView.bandUrl = currentView.artistUrl;
                delete currentView.artistUrl;
            }
            if (currentView.labelUrl) {
                currentView.bandUrl = currentView.labelUrl;
                delete currentView.labelUrl;
            }
        }
        /**
         * 'articles' and 'shows' are also absolute (replaced by singular form)
         */
        else if (currentView.name === 'articles') {
            currentView.name = 'article';
        }
        else if (currentView.name === 'shows') {
            currentView.name = 'show';
        }
        return new VIEW_NAME_TO_CLASS[currentView.name](uri, currentView, previousViews);
    }
}
exports.default = ViewHandlerFactory;
//# sourceMappingURL=ViewHandlerFactory.js.map