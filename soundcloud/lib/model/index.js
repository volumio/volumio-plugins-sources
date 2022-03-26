'use strict';

const modelInstances = {};

let typeToClass = {
    user: 'user',
    playlist: 'playlist',
    album: 'album',
    selection: 'selection',
    track: 'track'
};

let getInstance = (type) => {
    if (modelInstances[type] == undefined) {
        modelInstances[type] = new (require(__dirname + '/' + typeToClass[type]))();
    }
    return modelInstances[type];
}

module.exports = {
    getInstance: getInstance
};