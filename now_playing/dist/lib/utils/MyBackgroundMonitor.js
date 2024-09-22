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
var _MyBackgroundMonitor_instances, _MyBackgroundMonitor_images, _MyBackgroundMonitor_status, _MyBackgroundMonitor_watcher, _MyBackgroundMonitor_isSorted, _MyBackgroundMonitor_handleWatcherEvent, _MyBackgroundMonitor_sortImages;
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const SystemUtils = __importStar(require("./System"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const chokidar_1 = __importDefault(require("chokidar"));
const MY_BACKGROUNDS_PATH = '/data/INTERNAL/NowPlayingPlugin/My Backgrounds';
const ACCEPT_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif'
];
class MyBackgroundMonitor {
    constructor() {
        _MyBackgroundMonitor_instances.add(this);
        _MyBackgroundMonitor_images.set(this, void 0);
        _MyBackgroundMonitor_status.set(this, void 0);
        _MyBackgroundMonitor_watcher.set(this, void 0);
        _MyBackgroundMonitor_isSorted.set(this, void 0);
        __classPrivateFieldSet(this, _MyBackgroundMonitor_images, [], "f");
        __classPrivateFieldSet(this, _MyBackgroundMonitor_status, 'stopped', "f");
        __classPrivateFieldSet(this, _MyBackgroundMonitor_watcher, null, "f");
        __classPrivateFieldSet(this, _MyBackgroundMonitor_isSorted, false, "f");
    }
    getImages() {
        if (__classPrivateFieldGet(this, _MyBackgroundMonitor_status, "f") !== 'running') {
            NowPlayingContext_1.default.getLogger().warn('[now-playing] MyBackgroundMonitor is not running. Returning empty image list.');
            return [];
        }
        if (!__classPrivateFieldGet(this, _MyBackgroundMonitor_isSorted, "f")) {
            __classPrivateFieldGet(this, _MyBackgroundMonitor_instances, "m", _MyBackgroundMonitor_sortImages).call(this);
        }
        return __classPrivateFieldGet(this, _MyBackgroundMonitor_images, "f");
    }
    start() {
        if (!SystemUtils.dirExists(MY_BACKGROUNDS_PATH)) {
            NowPlayingContext_1.default.getLogger().warn(`[now-playing] ${MY_BACKGROUNDS_PATH} does not exist. MyBackgroundMonitor will not start.`);
            return;
        }
        __classPrivateFieldSet(this, _MyBackgroundMonitor_watcher, chokidar_1.default.watch(MY_BACKGROUNDS_PATH), "f");
        __classPrivateFieldGet(this, _MyBackgroundMonitor_watcher, "f").on('add', __classPrivateFieldGet(this, _MyBackgroundMonitor_instances, "m", _MyBackgroundMonitor_handleWatcherEvent).bind(this, 'add'));
        __classPrivateFieldGet(this, _MyBackgroundMonitor_watcher, "f").on('unlink', __classPrivateFieldGet(this, _MyBackgroundMonitor_instances, "m", _MyBackgroundMonitor_handleWatcherEvent).bind(this, 'unlink'));
        NowPlayingContext_1.default.getLogger().warn(`[now-playing] MyBackgroundMonitor is now watching ${MY_BACKGROUNDS_PATH}`);
        __classPrivateFieldSet(this, _MyBackgroundMonitor_status, 'running', "f");
    }
    async stop() {
        if (__classPrivateFieldGet(this, _MyBackgroundMonitor_watcher, "f")) {
            await __classPrivateFieldGet(this, _MyBackgroundMonitor_watcher, "f").close();
            __classPrivateFieldSet(this, _MyBackgroundMonitor_watcher, null, "f");
        }
        __classPrivateFieldSet(this, _MyBackgroundMonitor_images, [], "f");
        __classPrivateFieldSet(this, _MyBackgroundMonitor_isSorted, false, "f");
        __classPrivateFieldSet(this, _MyBackgroundMonitor_status, 'stopped', "f");
        NowPlayingContext_1.default.getLogger().warn('[now-playing] MyBackgroundMonitor stopped');
    }
}
_MyBackgroundMonitor_images = new WeakMap(), _MyBackgroundMonitor_status = new WeakMap(), _MyBackgroundMonitor_watcher = new WeakMap(), _MyBackgroundMonitor_isSorted = new WeakMap(), _MyBackgroundMonitor_instances = new WeakSet(), _MyBackgroundMonitor_handleWatcherEvent = function _MyBackgroundMonitor_handleWatcherEvent(event, pathToFile) {
    const { ext, base } = path_1.default.parse(pathToFile);
    if (!ACCEPT_EXTENSIONS.includes(ext)) {
        return;
    }
    NowPlayingContext_1.default.getLogger().info(`[now-playing] MyBackgroundMonitor captured '${event}': ${base}`);
    switch (event) {
        case 'add':
            __classPrivateFieldGet(this, _MyBackgroundMonitor_images, "f").push({
                name: base,
                path: path_1.default.resolve(pathToFile)
            });
            __classPrivateFieldSet(this, _MyBackgroundMonitor_isSorted, false, "f");
            break;
        case 'unlink':
            const index = __classPrivateFieldGet(this, _MyBackgroundMonitor_images, "f").findIndex((image) => image.name === base);
            if (index >= 0) {
                __classPrivateFieldGet(this, _MyBackgroundMonitor_images, "f").splice(index, 1);
            }
            break;
        default:
    }
}, _MyBackgroundMonitor_sortImages = function _MyBackgroundMonitor_sortImages() {
    __classPrivateFieldGet(this, _MyBackgroundMonitor_images, "f").sort((img1, img2) => img1.name.localeCompare(img2.name));
    __classPrivateFieldSet(this, _MyBackgroundMonitor_isSorted, true, "f");
};
const myBackgroundMonitor = new MyBackgroundMonitor();
exports.default = myBackgroundMonitor;
//# sourceMappingURL=MyBackgroundMonitor.js.map