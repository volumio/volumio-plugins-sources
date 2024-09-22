"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = exports.start = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const Router_1 = __importDefault(require("./Router"));
const NowPlayingContext_1 = __importDefault(require("../lib/NowPlayingContext"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
//App.use(express.urlencoded({ extended: false }));
// Routes
app.use(Router_1.default);
app.use('/assets', express_1.default.static(`${__dirname}/assets`));
app.use('/genius_setup', express_1.default.static(`${__dirname}/views/genius_setup.html`));
app.use('/geo_coord_setup', express_1.default.static(`${__dirname}/views/geo_coord_setup.html`));
app.use('/preview', express_1.default.static(`${__dirname}/preview/build`));
app.use(express_1.default.static(`${__dirname}/client/build`));
app.use((_req, _res, next) => {
    next(404);
});
app.use((err, _req, res) => {
    NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage('[now-playing] App error:', err));
    res.status(err.status || 500);
    res.sendStatus(err);
});
let server = null;
function start() {
    if (server) {
        NowPlayingContext_1.default.getLogger().info('[now-playing] App already started');
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const port = NowPlayingContext_1.default.getConfigValue('port');
        server = app.listen(port, () => {
            NowPlayingContext_1.default.getLogger().info(`[now-playing] App is listening on port ${port}.`);
            resolve();
        })
            .on('error', (err) => {
            NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage('[now-playing] App error:', err));
            reject(err);
        });
    });
}
exports.start = start;
function stop() {
    if (server) {
        server.close();
        server = null;
    }
}
exports.stop = stop;
//# sourceMappingURL=index.js.map