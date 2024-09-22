"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FolderContentParser_parsers;
Object.defineProperty(exports, "__esModule", { value: true });
const base_item_kind_1 = require("@jellyfin/sdk/lib/generated-client/models/base-item-kind");
const entities_1 = require("../../entities");
const AlbumParser_1 = __importDefault(require("./AlbumParser"));
const ArtistParser_1 = __importDefault(require("./ArtistParser"));
const BaseParser_1 = __importDefault(require("./BaseParser"));
const FolderParser_1 = __importDefault(require("./FolderParser"));
class FolderContentParser extends BaseParser_1.default {
    constructor() {
        super();
        _FolderContentParser_parsers.set(this, void 0);
        __classPrivateFieldSet(this, _FolderContentParser_parsers, {}, "f");
    }
    getParser(dtoType) {
        if (!__classPrivateFieldGet(this, _FolderContentParser_parsers, "f")[dtoType]) {
            switch (dtoType) {
                case base_item_kind_1.BaseItemKind.Folder:
                case base_item_kind_1.BaseItemKind.CollectionFolder:
                    __classPrivateFieldGet(this, _FolderContentParser_parsers, "f")[dtoType] = new FolderParser_1.default();
                    break;
                case base_item_kind_1.BaseItemKind.MusicAlbum:
                    __classPrivateFieldGet(this, _FolderContentParser_parsers, "f")[dtoType] = new AlbumParser_1.default();
                    break;
                case base_item_kind_1.BaseItemKind.MusicArtist:
                    __classPrivateFieldGet(this, _FolderContentParser_parsers, "f")[dtoType] = new ArtistParser_1.default(entities_1.EntityType.Artist);
                    break;
                default:
                    return null;
            }
        }
        return __classPrivateFieldGet(this, _FolderContentParser_parsers, "f")[dtoType] || null;
    }
    async parseDto(data, api) {
        const parser = data.Type ? this.getParser(data.Type) : null;
        if (!parser) {
            return null;
        }
        return parser.parseDto(data, api);
    }
}
exports.default = FolderContentParser;
_FolderContentParser_parsers = new WeakMap();
//# sourceMappingURL=FolderContentParser.js.map