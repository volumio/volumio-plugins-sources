'use strict';

const modelInstances = {};

let typeToClass = {
    discover: 'discover',
    cloudcast: 'cloudcast',
    playlist: 'playlist',
    user: 'user',
    tag: 'tag'
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