'use strict';

const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const Auth = require(ytmusicPluginLibRoot + '/utils/auth');
const FeedViewHandler = require(__dirname + '/feed');

class LibraryViewHander extends FeedViewHandler {

  browse() {
    if (Auth.getAuthStatus().status !== Auth.SIGNED_IN) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_REQUIRE_SIGN_IN'));
      throw new Error(ytmusic.getI18n('YTMUSIC_ERR_REQUIRE_SIGN_IN'));
    }

    return super.browse();
  }

  async getContents() {
    const view = this.getCurrentView();
    const continuation = view.continuation ? JSON.parse(decodeURIComponent(view.continuation)) : null;
    const endpoint = view.endpoint ? JSON.parse(decodeURIComponent(view.endpoint)) : null;
    const model = this.getModel('library');
    const contents = await model.getLibrary(endpoint, { continuation });

    if (endpoint?.actionType === 'continuation' && view.continuationEndpointBundle) {
      const bundle = JSON.parse(decodeURIComponent(view.continuationEndpointBundle));
      if (bundle.tabs) {
        if (!contents.sections[0].options) {
          contents.sections[0].options = [];
        }
        contents.sections[0].options.unshift(bundle.tabs);
      }
    }

    return contents;
  }

  parseItemDataToListItem(data, sectionIndex, contents, autoplayContext) {
    if (data.type === 'option') {
      if (data.optionValues.find((ov) => ov.endpoint?.actionType === 'continuation')) {
        // Tabs ('Library', 'Uploads') do not get returned in continuation endpoint call. Need to 
        // include in data to be passed back when option value selected.
        const tabs = contents.sections[0].options?.[0]; // Option for tabs
        if (tabs) {
          const passback = {
            name: 'continuationEndpointBundle',
            data: { tabs }
          };
          return this.getParser('option')?.parseToListItem(data, { passback });
        }
      }
    }
    
    return super.parseItemDataToListItem(data, sectionIndex, contents, autoplayContext);
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
