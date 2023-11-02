"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const NowPlayingContext_1 = __importDefault(require("../../NowPlayingContext"));
/**
 * Technical notes:
 * This updater actually does nothing other than update the config version.
 * This is strictly not necessary when there are no settings to be modified.
 * The updater is merely for testing purpose (but no harm leaving it here).
 */
const TO_VERSION = '0.3.4';
function update() {
    NowPlayingContext_1.default.getLogger().info(`[now-playing] Updating config version to ${TO_VERSION}`);
    NowPlayingContext_1.default.setConfigValue('configVersion', TO_VERSION);
    NowPlayingContext_1.default.getLogger().info('[now-playing] Update complete');
}
exports.update = update;
//# sourceMappingURL=config_from_0_3_3.js.map