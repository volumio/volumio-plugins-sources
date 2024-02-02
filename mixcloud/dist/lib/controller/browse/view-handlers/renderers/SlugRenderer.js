"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SlugRenderer_instances, _SlugRenderer_getAlbumArt;
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const slugify_1 = __importDefault(require("slugify"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const UIHelper_1 = __importDefault(require("../../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class SlugRenderer extends BaseRenderer_1.default {
    constructor() {
        super(...arguments);
        _SlugRenderer_instances.add(this);
    }
    renderToListItem(slug) {
        const discoverView = {
            name: 'discover',
            slug: slug.slug
        };
        const result = {
            service: 'mixcloud',
            type: 'folder',
            title: slug.name,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(discoverView)}`
        };
        const albumart = __classPrivateFieldGet(this, _SlugRenderer_instances, "m", _SlugRenderer_getAlbumArt).call(this, slug);
        if (albumart) {
            result.albumart = albumart;
        }
        else {
            result.icon = 'fa fa-tag';
        }
        return result;
    }
}
_SlugRenderer_instances = new WeakSet(), _SlugRenderer_getAlbumArt = function _SlugRenderer_getAlbumArt(slug) {
    const filename = `${(0, slugify_1.default)(slug.name).toLowerCase()}.png`;
    const srcPath = `music_service/mixcloud/dist/assets/images/slugs/${filename}`;
    const realPath = path_1.default.resolve(__dirname, `../../../../../assets/images/slugs/${filename}`);
    let retPath = `/albumart?sourceicon=${encodeURIComponent(srcPath)}`;
    let exists;
    try {
        exists = fs_1.default.existsSync(realPath);
    }
    catch (err) {
        exists = false;
    }
    if (!exists) {
        try {
            retPath = UIHelper_1.default.getRandomAlbumArtFromDir('tags');
        }
        catch (err) {
            retPath = null;
        }
    }
    return retPath;
};
exports.default = SlugRenderer;
//# sourceMappingURL=SlugRenderer.js.map