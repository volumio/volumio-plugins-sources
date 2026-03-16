"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TagViewHandler_instances, _TagViewHandler_browseTags, _TagViewHandler_getTagsList;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const renderers_1 = require("./renderers");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const FILTER_ICONS = {
    sort: 'fa fa-sort',
    location: 'fa fa-map-marker',
    format: 'fa fa-archive'
};
const FILTER_NAMES = ['format', 'location', 'sort'];
class TagViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _TagViewHandler_instances.add(this);
        /*  Async getTracksOnExplode() {
          throw Error('not supported');
          /*const view = this.currentView;
          const tagUrl = view.tagUrl;
      
          if (!tagUrl) {
            throw Error('Tag URL missing');
          }
      
          const modelParams: TagModelGetReleasesParams = {
            tagUrl,
            limit: bandcamp.getConfigValue('itemsPerPage', 47),
            filters: await this.#getReleasesFiltersFromUriAndDefault()
          };
      
          if (view.pageRef) {
            modelParams.pageToken = view.pageRef.pageToken;
            modelParams.pageOffset = view.pageRef.pageOffset;
          }
      
          const releases = await this.getModel(ModelType.Tag).getReleases(modelParams);
          const tracks = releases.items.reduce<TrackEntity[]>((result, release) => {
            if (release.type === 'album' && release.featuredTrack?.streamUrl) {
              const track: TrackEntity = {
                type: 'track',
                name: release.featuredTrack.name,
                thumbnail: release.thumbnail,
                artist: release.artist,
                album: {
                  type: 'album',
                  name: release.name,
                  url: release.url
                },
                position: release.featuredTrack.position,
                streamUrl: release.featuredTrack.streamUrl
              };
              result.push(track);
            }
            else if (release.type === 'track') {
              const track: TrackEntity = {
                type: 'track',
                name: release.name,
                url: release.url,
                thumbnail: release.thumbnail,
                artist: release.artist,
                streamUrl: release.streamUrl
              };
              result.push(track);
            }
            return result;
          }, []);
      
          return tracks;
        }*/
        /**
         * Override
         *
         * Track uri - one of:
         * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}
         * - bandcamp/track@trackUrl={...}@artistUrl={...}@albumurl={...}
         */
        /*GetTrackUri(track: TrackEntity) {
          const artistUrl = track.artist?.url || null;
          const albumUrl = track.album?.url || artistUrl;
          const trackUrl = track.url || null;
      
          if (track.album && albumUrl) {
            const albumView: AlbumView = {
              name: 'album',
              albumUrl
            };
            if (track.position) {
              albumView.track = track.position.toString();
            }
            if (artistUrl) {
              albumView.artistUrl = artistUrl;
            }
      
            return `bandcamp/${ViewHelper.constructUriSegmentFromView(albumView)}`;
          }
      
          if (trackUrl) {
            const trackView: TrackView = {
              name: 'track',
              trackUrl
            };
            if (artistUrl) {
              trackView.artistUrl = artistUrl;
            }
            if (albumUrl) {
              trackView.albumUrl = albumUrl;
            }
            return `bandcamp/${ViewHelper.constructUriSegmentFromView(trackView)}`;
          }
      
          return null;
        }*/
    }
    async browse() {
        return __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_browseTags).call(this);
    }
}
_TagViewHandler_instances = new WeakSet(), _TagViewHandler_browseTags = async function _TagViewHandler_browseTags() {
    const tags = await this.getModel(model_1.ModelType.Tag).getTags();
    const lists = [
        __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getTagsList).call(this, tags, 'tags', BandcampContext_1.default.getI18n('BANDCAMP_TAGS'), 'fa fa-tag'),
        __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getTagsList).call(this, tags, 'locations', BandcampContext_1.default.getI18n('BANDCAMP_LOCATIONS'), 'fa fa-map-marker')
    ];
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _TagViewHandler_getTagsList = function _TagViewHandler_getTagsList(tags, key, title, icon) {
    const tagRenderer = this.getRenderer(renderers_1.RendererType.Tag);
    const listItems = tags[key].reduce((result, tag) => {
        const rendered = tagRenderer.renderToListItem(tag);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    return {
        title: UIHelper_1.default.addIconToListTitle(icon, title),
        availableListViews: ['list'],
        items: listItems
    };
};
exports.default = TagViewHandler;
//# sourceMappingURL=TagViewHandler.js.map