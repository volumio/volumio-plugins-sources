'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const BaseViewHandler = require(__dirname + '/base');

class RootViewHandler extends BaseViewHandler {

  browse() {
    const items = [
      {
        service: 'ytmusic',
        type: 'ytmusicRootItem',
        title: ytmusic.getI18n('YTMUSIC_HOME'),
        uri: 'ytmusic/home',
        icon: 'fa fa-home'
      },
      {
        service: 'ytmusic',
        type: 'ytmusicRootItem',
        title: ytmusic.getI18n('YTMUSIC_EXPLORE'),
        uri: 'ytmusic/explore',
        icon: 'fa fa-binoculars'
      },
      {
        service: 'ytmusic',
        type: 'ytmusicRootItem',
        title: ytmusic.getI18n('YTMUSIC_LIBRARY'),
        uri: 'ytmusic/library',
        icon: 'fa fa-bookmark'
      }
    ];

    const lists = [
      {
        title: 'YouTube Music',
        availableListViews: ['grid', 'list'],
        items
      }
    ];

    const nav = {
      prev: {
        uri: '/'
      },
      lists
    };

    return libQ.resolve({ navigation: nav });
  }

}

module.exports = RootViewHandler;
