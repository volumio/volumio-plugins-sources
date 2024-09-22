"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerRunState = void 0;
var PlayerRunState;
(function (PlayerRunState) {
    PlayerRunState[PlayerRunState["Normal"] = 0] = "Normal";
    PlayerRunState[PlayerRunState["StartError"] = -1] = "StartError";
    PlayerRunState[PlayerRunState["ConfigRequireRestart"] = -2] = "ConfigRequireRestart";
    PlayerRunState[PlayerRunState["ConfigRequireRevalidate"] = -3] = "ConfigRequireRevalidate";
})(PlayerRunState = exports.PlayerRunState || (exports.PlayerRunState = {}));
//# sourceMappingURL=Player.js.map