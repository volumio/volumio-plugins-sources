'use strict';

const modelInstances = {};

const typeToClass = {
  home: 'home',
  album: 'album',
  artist: 'artist',
  video: 'video',
  playlist: 'playlist',
  endpoint: 'endpoint',
  explore: 'explore',
  library: 'library',
  config: 'config',
  search: 'search'
};

const getInstance = (type) => {
  if (modelInstances[type] == undefined) {
    modelInstances[type] = new (require(__dirname + '/' + typeToClass[type]))();
  }
  return modelInstances[type];
}

module.exports = {
  getInstance
};
