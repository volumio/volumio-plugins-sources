'use strict';

const modelInstances = {};

let typeToClass = {
    album: 'album',
    band: 'band',  // Replaces obsolete 'artist' and 'label' models
    discography: 'discography',
    discover: 'discover',
    track: 'track',
    search: 'search',
    show: 'show',
    article: 'article',
    tag: 'tag',
    fan: 'fan'
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