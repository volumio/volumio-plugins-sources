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
var _ArtistParser_type;
Object.defineProperty(exports, "__esModule", { value: true });
const BaseParser_1 = __importDefault(require("./BaseParser"));
class ArtistParser extends BaseParser_1.default {
    constructor(type) {
        super();
        _ArtistParser_type.set(this, void 0);
        __classPrivateFieldSet(this, _ArtistParser_type, type, "f");
    }
    async parseDto(data, api) {
        const base = await super.parseDto(data, api);
        if (!base) {
            return null;
        }
        return {
            ...base,
            type: __classPrivateFieldGet(this, _ArtistParser_type, "f"),
            genres: this.getGenres(data)
        };
    }
}
exports.default = ArtistParser;
_ArtistParser_type = new WeakMap();
//# sourceMappingURL=ArtistParser.js.map