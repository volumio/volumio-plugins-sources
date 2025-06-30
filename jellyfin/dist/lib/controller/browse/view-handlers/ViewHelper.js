"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _ViewHelper_getViewFromUriSegment;
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const FilterModel_1 = require("../../../model/filter/FilterModel");
const ServerHelper_1 = __importDefault(require("../../../util/ServerHelper"));
class ViewHelper {
    static getViewsFromUri(uri) {
        const segments = uri.split('/');
        if (segments[0] !== 'jellyfin') {
            return [];
        }
        const result = [];
        let serverId;
        let username;
        segments.forEach((segment, index) => {
            let view;
            if (index === 0) { // 'jellyfin/...'
                view = {
                    name: 'root'
                };
            }
            else if (index === 1) { // 'jellyfin/username@serverId/...'
                view = {
                    name: 'userViews'
                };
                const segmentParts = segment.split('@');
                if (segmentParts.length === 2) {
                    username = decodeURIComponent(segmentParts[0]);
                    serverId = decodeURIComponent(segmentParts[1]);
                }
                else {
                    username = '';
                    serverId = decodeURIComponent(segmentParts[0]);
                }
                view.serverId = serverId;
                view.username = username;
            }
            else {
                view = __classPrivateFieldGet(this, _a, "m", _ViewHelper_getViewFromUriSegment).call(this, segment);
                view.serverId = serverId;
                view.username = username;
            }
            result.push(view);
        });
        return result;
    }
    static constructUriSegmentFromView(view) {
        let segment;
        if (view.name === 'root') {
            segment = 'jellyfin';
        }
        else if (view.name === 'userViews' && view.serverId && view.username) {
            segment = ServerHelper_1.default.generateConnectionId(view.username, view.serverId);
        }
        else {
            segment = view.name;
        }
        const skip = ['name', 'startIndex', 'serverId', 'username', 'saveFilter', 'noExplode'];
        Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
            if (view[key] !== undefined) {
                segment += `@${key}=${encodeURIComponent(view[key])}`;
            }
        });
        if (view.startIndex) {
            segment += `@startIndex=${view.startIndex}`;
        }
        return segment;
    }
    static getFilterModelConfigFromView(view, filterType) {
        switch (filterType) {
            case FilterModel_1.FilterType.AZ:
                return view.nameStartsWith ? {
                    initialSelection: { nameStartsWith: view.nameStartsWith }
                } : {};
            case FilterModel_1.FilterType.Filter:
                let filterFilterItemType;
                switch (view.name) {
                    case 'albums':
                        filterFilterItemType = entities_1.EntityType.Album;
                        break;
                    case 'songs':
                        filterFilterItemType = entities_1.EntityType.Song;
                        break;
                    case 'artists':
                        filterFilterItemType = entities_1.EntityType.Artist;
                        break;
                    case 'albumArtists':
                        filterFilterItemType = entities_1.EntityType.AlbumArtist;
                        break;
                    default:
                        return null;
                }
                const filterFilterConfig = {
                    itemType: filterFilterItemType
                };
                if (view.filters) {
                    filterFilterConfig.initialSelection = {
                        filters: view.filters.split(',')
                    };
                }
                return filterFilterConfig;
            case FilterModel_1.FilterType.Genre:
                if (!view.parentId) {
                    return null;
                }
                const genreFilterConfig = {
                    parentId: view.parentId
                };
                if (view.genreIds) {
                    genreFilterConfig.initialSelection = {
                        genreIds: view.genreIds.split(',')
                    };
                }
                return genreFilterConfig;
            case FilterModel_1.FilterType.Sort:
                let sortFilterItemType;
                switch (view.name) {
                    case 'albums':
                        sortFilterItemType = entities_1.EntityType.Album;
                        break;
                    case 'songs':
                        sortFilterItemType = entities_1.EntityType.Song;
                        break;
                    case 'folder':
                        sortFilterItemType = entities_1.EntityType.Folder;
                        break;
                    default:
                        return null;
                }
                const sortFilterConfig = {
                    itemType: sortFilterItemType
                };
                if (view.sortBy || view.sortOrder) {
                    sortFilterConfig.initialSelection = {};
                    if (view.sortBy) {
                        sortFilterConfig.initialSelection.sortBy = view.sortBy;
                    }
                    if (view.sortOrder) {
                        sortFilterConfig.initialSelection.sortOrder = view.sortOrder;
                    }
                }
                return sortFilterConfig;
            case FilterModel_1.FilterType.Year:
                if (!view.parentId) {
                    return null;
                }
                let yearFilterItemType;
                switch (view.name) {
                    case 'albums':
                        yearFilterItemType = entities_1.EntityType.Album;
                        break;
                    case 'songs':
                        yearFilterItemType = entities_1.EntityType.Song;
                        break;
                    default:
                        return null;
                }
                const yearFilterConfig = {
                    parentId: view.parentId,
                    itemType: yearFilterItemType
                };
                if (view.years) {
                    yearFilterConfig.initialSelection = {
                        years: view.years.split(',')
                    };
                }
                return yearFilterConfig;
            default:
                return null;
        }
    }
}
exports.default = ViewHelper;
_a = ViewHelper, _ViewHelper_getViewFromUriSegment = function _ViewHelper_getViewFromUriSegment(segment) {
    const result = {
        name: '',
        startIndex: 0
    };
    segment.split('@').forEach((s) => {
        const equalIndex = s.indexOf('=');
        if (equalIndex < 0) {
            result.name = s;
        }
        else {
            const key = s.substring(0, equalIndex);
            const value = s.substring(equalIndex + 1);
            if (key === 'startIndex') {
                result[key] = parseInt(value, 10);
            }
            else {
                result[key] = decodeURIComponent(value);
            }
        }
    });
    return result;
};
//# sourceMappingURL=ViewHelper.js.map