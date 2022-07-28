'use strict';

const ejs = require('ejs');
const np = require(nowPlayingPluginLibRoot + '/np');
const config = require(nowPlayingPluginLibRoot + '/config');
const apiHandlers = {
    'metadata': require(nowPlayingPluginLibRoot + '/api/metadata'),
    'settings': require(nowPlayingPluginLibRoot + '/api/settings'),
    'weather': require(nowPlayingPluginLibRoot + '/api/weather')
};

async function index(req, res) {
    let html = await renderView('index', req, {
        settings: {
            'screen.nowPlaying': np.getConfigValue('screen.nowPlaying', {}, true),
            'screen.idle': np.getConfigValue('screen.idle', {}, true),
            background: np.getConfigValue('background', {}, true),
            actionPanel: np.getConfigValue('actionPanel', {}, true),
            theme: np.getConfigValue('theme', 'default'),
            performance: np.getConfigValue('performance', null, true),
            localization: config.getLocalizationSettings()
        }
    });
    res.send(html);
}

async function volumio(req, res) {
    let html = await renderView('volumio', req, {
        nowPlayingUrl: getNowPlayingURL(req)
    });
    res.send(html);
}

async function preview(req, res) {
    let html = await renderView('preview', req, {
        nowPlayingUrl: getNowPlayingURL(req)
    });
    res.send(html);
}

async function api(namespace, method, params, res) {
    const apiHandler = namespace && method ? apiHandlers[namespace] : null;
    const fn = apiHandler && typeof apiHandler[method] === 'function' ? apiHandler[method] : null;
    if (fn) {
        try {
            const result = await fn(params);
            res.json({
                success: true,
                data: result
            });
        } catch (e) {
            res.json({
                success: false,
                error: e.message || e
            });
        }
    }
    else {
        res.json({
            success: false,
            error: `Invalid API endpoint ${namespace}/${method}`
        });
    }
}

function getNowPlayingURL(req) {
    return `${req.protocol}://${ req.hostname }:${ np.getConfigValue('port', 4004) }`;
}

function renderView(name, req, data = {}) {
    if (!data.i18n) {
        data.i18n = np.getI18n.bind(np);
    }
    if (!data.host) {
        data.host = `${req.protocol}://${ req.hostname }:3000`;
    }
    if (!data.pluginInfo) {
        data.pluginInfo = np.get('pluginInfo');
    }
    return new Promise( (resolve, reject) => {
        ejs.renderFile(`${ __dirname }/../views/${ name }.ejs`, data, {}, (err, str) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(str);
            }
        });
    });
}

module.exports = { index, volumio, preview, api };
