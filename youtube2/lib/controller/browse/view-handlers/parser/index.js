'use strict';

const ChannelParser = require(__dirname + '/channel');
const PlaylistParser = require(__dirname + '/playlist');
const VideoParser = require(__dirname + '/video');

let typeToClass = {
    channel: ChannelParser,
    playlist: PlaylistParser,
    video: VideoParser
};

let getInstance = (type, uri, curView, prevViews) => {
    return new typeToClass[type](uri, curView, prevViews);
}

module.exports = {
    getInstance: getInstance
};
