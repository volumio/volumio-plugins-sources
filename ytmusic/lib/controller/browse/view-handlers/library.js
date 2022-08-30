'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const Auth = require(ytmusicPluginLibRoot + '/utils/auth');
const FeedViewHandler = require(__dirname + '/feed');

const TAB_ICONS = {
  'FEmusic_history': 'fa fa-history',
  'FEmusic_liked_playlists': 'fa fa-list',
  'FEmusic_liked_albums': 'fa fa-dot-circle-o',
  'FEmusic_liked_videos': 'fa fa-music',
  'FEmusic_library_corpus_track_artists': 'fa fa-user',
  'FEmusic_library_corpus_artists': 'fa fa-user-circle-o'
};

class LibraryViewHander extends FeedViewHandler {

  #tabs;

  browse() {
    if (Auth.getAuthStatus().status !== Auth.SIGNED_IN) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_REQUIRE_SIGN_IN'));
      throw new Error(ytmusic.getI18n('YTMUSIC_ERR_REQUIRE_SIGN_IN'));
    }
    
    const defer = libQ.defer();

    super.browse().then((result) => {
      const rootItems = this.#tabs?.map((tab) => ({
        service: 'ytmusic',
        type: 'ytmusicLibraryRootItem',
        title: tab.title,
        uri: `ytmusic/library@endpoint=${encodeURIComponent(JSON.stringify(tab.endpoint))}`,
        icon: TAB_ICONS[tab.endpoint?.browse?.id] || 'fa fa-archive'
      })) || [];

      if (rootItems.length > 0) {
        result.navigation.lists.unshift({
          title: ytmusic.getI18n('YTMUSIC_LIBRARY'),
          availableListViews: ['list', 'grid'],
          items: rootItems
        });
      }

      defer.resolve(result);
    })
    .fail((error) => {
      defer.reject(error);
    });

    return defer.promise;
  }

  async getContents() {
    const view = this.getCurrentView();
    const continuation = view.continuation ? JSON.parse(decodeURIComponent(view.continuation)) : null;
    const endpoint = view.endpoint ? JSON.parse(decodeURIComponent(view.endpoint)) : null;
    const model = this.getModel('library');
    if (continuation || endpoint) {
      return model.getEndpointContents(endpoint, { continuation });
    }
    else {
      const contents = await model.getRootContents();
      this.#tabs = contents.tabs;
      return contents;
    }
  }

  getAvailableListViews(sectionIndex, contents) {
    const items = contents.sections[sectionIndex].contents;
    if (items?.find((item) => ['libraryArtist', 'artist'].includes(item.type))) {
        return 'grid';
    }
    return null;
  }
}

module.exports = LibraryViewHander;
