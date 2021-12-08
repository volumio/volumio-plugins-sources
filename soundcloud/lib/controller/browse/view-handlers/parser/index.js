'use strict';

const AlbumParser = require(__dirname + '/album');
const PlaylistParser = require(__dirname + '/playlist');
const TrackParser = require(__dirname + '/track');
const UserParser = require(__dirname + '/user');

let typeToClass = {
    album: AlbumParser,
    playlist: PlaylistParser,
    track: TrackParser,
    user: UserParser
};

let getInstance = (type, uri, curView, prevViews) => {
    return new typeToClass[type](uri, curView, prevViews);
}

module.exports = {
    getInstance: getInstance
};
