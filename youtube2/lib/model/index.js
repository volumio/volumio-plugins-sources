'use strict';

const yt2 = require(yt2PluginLibRoot + '/youtube2');

const modelInstances = {};

let typeToClass = {
    channel: 'channel',
    playlist: 'playlist',
    video: 'video'
};

let getInstance = (type) => {
    let dataRetrievalMethod = yt2.getConfigValue('dataRetrievalMethod', 'scraping');
    if (modelInstances[dataRetrievalMethod] == undefined) {
        modelInstances[dataRetrievalMethod] = {};
    }
    if (modelInstances[dataRetrievalMethod][type] == undefined) {
        modelInstances[dataRetrievalMethod][type] = new (require(__dirname + '/' + dataRetrievalMethod + '/' + typeToClass[type]))();
    }
    return modelInstances[dataRetrievalMethod][type];
}

module.exports = {
    getInstance: getInstance
};