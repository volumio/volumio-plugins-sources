'use strict';

const CloudcastParser = require(__dirname + '/cloudcast');
const PlaylistParser = require(__dirname + '/playlist');
const UserParser = require(__dirname + '/user');
const SlugItemParser = require(__dirname + '/slug');

let typeToClass = {
    cloudcast: CloudcastParser,
    playlist: PlaylistParser,
    user: UserParser,
    slugItem: SlugItemParser,
};

let getInstance = (type, uri, curView, prevViews) => {
    return new typeToClass[type](uri, curView, prevViews);
}

module.exports = {
    getInstance: getInstance
};
