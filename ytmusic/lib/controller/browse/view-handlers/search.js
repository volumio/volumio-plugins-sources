'use strict';

const escape = require('escape-html');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const FeedViewHandler = require(__dirname + '/feed');

class SearchViewHandler extends FeedViewHandler {

  #title;

  browse() {
    const view = this.getCurrentView();
    const query = view.query ? decodeURIComponent(view.query).trim() : '';
    if (!query && !view.endpoint) {
      return libQ.resolve({
        navigation: {
          lists: []
        }
      });
    }

    return super.browse().then((result) => {
      if (result.navigation.lists.length > 0) {
        result.navigation.lists[0].title = this.#title;
      }
      return result;
    });
  }

  async getContents() {
    const view = this.getCurrentView();
    const model = this.getModel('search');
    if (view.endpoint) {
      const endpoint = JSON.parse(decodeURIComponent(view.endpoint));
      this.#title = ytmusic.getI18n('YTMUSIC_SEARCH_TITLE', escape(endpoint.search.query));
      return model.getSearchResultsByEndpoint(endpoint, {
        continuation: view.continuation ? JSON.parse(decodeURIComponent(view.continuation)) : null
      });
    }

    const query = decodeURIComponent(view.query);
    this.#title = ytmusic.getI18n('YTMUSIC_SEARCH_TITLE', escape(query));
    return model.getSearchResultsByQuery(query);
  }

  createContinuationBundle(sectionIndex, contents) {
    const bundle = super.createContinuationBundle(sectionIndex, contents);
    if (!bundle.contents) {
      bundle.contents = {};
    }
    if (!bundle.contents.sectionsBefore) {
      bundle.contents.sectionsBefore = [];
    }
    // Push first section which contains the search filters
    if (contents.sections[0]) {
      bundle.contents.sectionsBefore.push(contents.sections[0]);
    }
    return bundle;
  }

  getAvailableListViews(sectionIndex, contents) {
    const items = contents.sections[sectionIndex].contents;
    if (items?.find((item) => ['artist', 'playlist', 'album'].includes(item.type))) {
        return 'grid';
    }
    return null;
  }

}

module.exports = SearchViewHandler;
