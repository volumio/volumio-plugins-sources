"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const FilterableViewHandler_1 = __importDefault(require("./FilterableViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const Explodable_1 = require("./Explodable");
const FilterModel_1 = require("../../../model/filter/FilterModel");
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class SongViewHandler extends FilterableViewHandler_1.default {
    async browse() {
        const prevUri = this.constructPrevUri();
        const view = this.currentView;
        const albumId = view.albumId;
        const playlistId = view.playlistId;
        const isAlbum = !!albumId;
        const isPlaylist = !!playlistId;
        const listViewOnly = isAlbum || isPlaylist;
        let pagination;
        if ((isAlbum && JellyfinContext_1.default.getConfigValue('showAllAlbumTracks')) ||
            (isPlaylist && JellyfinContext_1.default.getConfigValue('showAllPlaylistTracks'))) {
            pagination = false;
        }
        else {
            pagination = true;
        }
        const { lists, modelQueryParams } = await this.handleFilters();
        if (isAlbum) {
            modelQueryParams.parentId = albumId;
            if (JellyfinContext_1.default.getConfigValue('showAllAlbumTracks')) {
                modelQueryParams.limit = -1;
            }
        }
        else if (isPlaylist) {
            modelQueryParams.parentId = playlistId;
            modelQueryParams.sortBy = null;
            modelQueryParams.sortOrder = null;
            if (JellyfinContext_1.default.getConfigValue('showAllPlaylistTracks')) {
                modelQueryParams.limit = -1;
            }
        }
        else if (view.search && view.collatedSearchResults) {
            modelQueryParams.limit = JellyfinContext_1.default.getConfigValue('searchSongsResultCount');
        }
        const model = this.getModel(model_1.ModelType.Song);
        const renderer = this.getRenderer(entities_1.EntityType.Song);
        const songs = await model.getSongs(modelQueryParams);
        const listItems = songs.items.map((song) => renderer.renderToListItem(song)).filter((item) => item);
        if (pagination && songs.nextStartIndex) {
            if (view.search && view.collatedSearchResults && this.serverConnection) {
                const songView = {
                    name: 'songs',
                    search: view.search
                };
                const moreUri = `jellyfin/${this.serverConnection.id}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`;
                listItems.push(this.constructMoreItem(moreUri));
            }
            else {
                const nextUri = this.constructNextUri(songs.nextStartIndex);
                listItems.push(this.constructNextPageItem(nextUri));
            }
        }
        lists.push({
            availableListViews: listViewOnly || listItems.length === 0 ? ['list'] : ['list', 'grid'],
            items: listItems
        });
        let header;
        if (isAlbum) {
            const albumModel = this.getModel(model_1.ModelType.Album);
            const album = await albumModel.getAlbum(albumId);
            const albumRenderer = this.getRenderer(entities_1.EntityType.Album);
            if (album) {
                header = albumRenderer.renderToHeader(album);
            }
            if (album) {
                const similarAlbums = await albumModel.getSimilarAlbums({ album });
                if (similarAlbums.length > 0) {
                    lists.push({
                        title: JellyfinContext_1.default.getI18n('JELLYFIN_MORE_LIKE_THIS'),
                        availableListViews: ['list', 'grid'],
                        items: similarAlbums.map((album) => albumRenderer.renderToListItem(album)).filter((item) => item)
                    });
                }
            }
        }
        else if (isPlaylist) {
            const playlistModel = this.getModel(model_1.ModelType.Playlist);
            const playlist = await playlistModel.getPlaylist(playlistId);
            if (playlist) {
                const playlistRenderer = this.getRenderer(entities_1.EntityType.Playlist);
                header = playlistRenderer.renderToHeader(playlist);
            }
        }
        const pageContents = {
            prev: {
                uri: prevUri
            },
            info: header || undefined,
            lists
        };
        if (!header) {
            await this.setPageTitle(pageContents);
        }
        return {
            navigation: pageContents
        };
    }
    async getSongsOnExplode() {
        const view = this.currentView;
        const model = this.getModel(model_1.ModelType.Song);
        if (view.name === 'song' && view.songId) {
            const song = await model.getSong(view.songId);
            if (song) {
                return [song];
            }
            throw Error('Song not found');
        }
        else if (view.name === 'songs') {
            const { modelQueryParams } = await this.handleFilters();
            modelQueryParams.limit = JellyfinContext_1.default.getConfigValue('maxTracks');
            if (view.albumId) {
                modelQueryParams.parentId = view.albumId;
                if (JellyfinContext_1.default.getConfigValue('noMaxTracksSingleAlbum')) {
                    modelQueryParams.limit = -1;
                }
            }
            else if (view.playlistId) {
                modelQueryParams.parentId = view.playlistId;
                if (JellyfinContext_1.default.getConfigValue('noMaxTracksSinglePlaylist')) {
                    modelQueryParams.limit = -1;
                }
            }
            return (await model.getSongs(modelQueryParams)).items;
        }
        else {
            // Should never reach here, but just in case...
            throw Error(`View name is ${view.name} but handler is for song`);
        }
    }
    getFilterableViewConfig() {
        const view = this.currentView;
        const albumId = view.albumId;
        const playlistId = view.playlistId;
        const isAlbum = !!albumId;
        const isPlaylist = !!playlistId;
        const showFilters = !view.fixedView && !view.search && !isAlbum && !isPlaylist;
        const saveFiltersKey = `${view.parentId}.song`;
        const filterTypes = [FilterModel_1.FilterType.Sort, FilterModel_1.FilterType.Filter, FilterModel_1.FilterType.Genre, FilterModel_1.FilterType.Year];
        return {
            showFilters,
            saveFiltersKey,
            filterTypes
        };
    }
}
exports.default = (0, Explodable_1.Explodable)(SongViewHandler);
//# sourceMappingURL=SongViewHandler.js.map