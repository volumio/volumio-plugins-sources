const express = require('express');
var cors = require('cors');
const router = require(__dirname + '/router');

const np = require(nowPlayingPluginLibRoot + '/np');

const app = express();

app.use(cors());
app.use(express.json());
//app.use(express.urlencoded({ extended: false }));

// Routes
app.use(router);
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/genius_setup', express.static(__dirname + '/views/genius_setup.html'));
app.use('/geo_coord_setup', express.static(__dirname + '/views/geo_coord_setup.html'));
app.use('/openweathermap_setup', express.static(__dirname + '/views/openweathermap_setup.html'));
app.use('/preview', express.static(__dirname + '/preview/build'));
app.use(express.static(__dirname + '/client/build'));
app.use( (req, res, next) => {
    next(404);
});
app.use( (err, req, res, next) => {
    np.getLogger().error(np.getErrorMessage('[now-playing-app] App error:', err));
    res.status(err.status || 500);
    res.sendStatus(err);
});

let server = null;

function start(options) {
    if (server) {
        np.getLogger().info('[now-playing-app] App already started');
        return Promise.resolve();
    }
    return new Promise( (resolve, reject) => {
        let port = options.port || 4004;
        server = app.listen(port, () => {
            np.getLogger().info(`[now-playing-app] App is listening on port ${ port }.`);
            resolve();
        })
        .on('error', err => {
            np.getLogger().error(np.getErrorMessage('[now-playing-app] App error:', err));
            reject(err);
        });
    });
}

function stop() {
    if (server) {
        server.close();
        server = null;
    }
}

module.exports = { start, stop };
