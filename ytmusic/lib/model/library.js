'use strict';

const { default: NavigationEndpoint } = require("volumio-youtubei.js/dist/src/parser/classes/NavigationEndpoint");
const EndpointModel = require(__dirname + '/endpoint');

const BROWSE_IDS = {
  'history': 'FEmusic_history',
  'playlists': 'FEmusic_liked_playlists',
  'albums': 'FEmusic_liked_albums',
  'songs': 'FEmusic_liked_videos',
  'artists': 'FEmusic_library_corpus_track_artists',
  'subscriptions': 'FEmusic_library_corpus_artists'
};

const MAIN_SECTION_ALLOWED_ITEM_TYPES = ['playlist', 'album', 'song', 'video', 'artist', 'libraryArtist'];

class LibraryModel extends EndpointModel {

  async getRootContents() {
    const endpoint = this._createBrowseEndpoint(BROWSE_IDS['playlists']);
    const contents = await this.getContents(endpoint);
    const sections = this._identifySections(contents);
    
    const tabs = sections.primary?.tabs.map((tab) => ({
      title: tab.title,
      endpoint: tab.endpoint
    }));

    return {
      tabs,
      sections: sections.secondary
    };
  }

  async getEndpointContents(endpoint, opts) {
    const contents = await this.getContents(endpoint, opts);

    if (!opts?.continuation) {
      const mainSection = this._identifySections(contents).primary;
      const isMatchBrowseId = mainSection?.tabs.find((tab) => tab.selected)?.endpoint?.browse?.id === endpoint.browse.id;

      contents.sections = isMatchBrowseId ? [mainSection] : [];

      if (isMatchBrowseId) {
        // Filter section contents
        mainSection.contents = mainSection.contents?.filter((item) => MAIN_SECTION_ALLOWED_ITEM_TYPES.includes(item.type)) || [];
      }
    }

    return contents;
  }

  _createBrowseEndpoint(browseId) {
    return new NavigationEndpoint({
      browseEndpoint: { browseId }
    });
  }

  _identifySections(contents) {
    const allBrowseIds = Object.values(BROWSE_IDS);
    const primarySectionIndex = contents.sections?.findIndex((section) => {
      if (section.tabs) {
        for (const tab of section.tabs) {
          if (allBrowseIds.includes(tab.endpoint?.browse?.id)) {
            return true;
          }
        }
      }
      return false;
    }) || -1;

    const secondarySections = [...contents.sections];
    const primarySection = primarySectionIndex >= 0 ? secondarySections.splice(primarySectionIndex, 1)[0] : null;
    return {
      primary: primarySection,
      secondary: secondarySections
    };
  }
}

module.exports = LibraryModel;
