'use strict';

const modelInstances = {};

const typeToClass = {
  root: 'root',
  video: 'video',
  endpoint: 'endpoint',
  playlist: 'playlist',
  search: 'search',
  account: 'account',
  config: 'config'
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
