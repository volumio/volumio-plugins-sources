'use strict';

const Parser = require('volumio-youtubei.js').Parser;
const SingleColumnBrowseResults = require('volumio-youtubei.js').YTNodes.SingleColumnBrowseResults;
const { InnerTubeParser, InnerTubeBaseModel } = require('./innertube');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');

const LANDING_ENDPOINT = {
  actionType: 'browse',
  payload: {
    browseId: 'FEmusic_library_landing'
  }
};

class LibraryModel extends InnerTubeBaseModel {

  async getLibrary(endpoint, opts) {
    if (!endpoint?.payload) {
      endpoint = LANDING_ENDPOINT;
    }

    const payload = { ...endpoint.payload, client: 'YTMUSIC' };

    if (opts?.continuation) {
      payload.token = opts.continuation.token;
    }

    const innerTube = this.getInnerTube();
    const response = await innerTube.actions.execute('/browse', payload);
    const page = Parser.parseResponse(response.data);
    
    if (!opts?.continuation) {
      let tabs, header, librarySections;

      // Tabs: 'library', 'uploads' (note: if endpoint type is `continuation`, then the continuation contents do not include tabs)
      if (endpoint.actionType === 'browse') {
        tabs = page.contents_memo.getType(SingleColumnBrowseResults)?.[0]?.tabs;
        const selectedTab = tabs?.find((tab) => tab.selected);
        header = InnerTubeParser.unwrapItem(selectedTab?.content?.header);
        librarySections = InnerTubeParser.unwrapArray(selectedTab?.content?.contents) || [];
      }
      else { // endpoint.actionType: 'continuation'
        header = InnerTubeParser.unwrapItem(page.continuation_contents.header);
        librarySections = InnerTubeParser.unwrapArray(page.continuation_contents.contents) || [];
      }

      // Chips represent the filters (playlists, songs, albums, artists...)
      const chips = header?.start_items?.[0]?.chips;
      if (chips) {
        // Find 'reset filter' chip. It will be missing if no filter is selected. If it exists, then
        // it is the one without text, in which case we set its text to 'Everything'.
        const resetFilterChip = chips.find((chip) => !InnerTubeParser.unwrapText(chip.text));
        if (!resetFilterChip) {
          chips.unshift({
            is_selected: true,
            text: ytmusic.getI18n('YTMUSIC_NO_FILTERS'),
            endpoint
          });
        }
        else {
          resetFilterChip.text = ytmusic.getI18n('YTMUSIC_NO_FILTERS');
        }

        // Ensure 'reset filter' chip is not selected if a filter is applied
        const selectedChips = chips.filter((chip) => chip.is_selected);
        if (selectedChips.length > 1 && resetFilterChip?.is_selected) {
          resetFilterChip.is_selected = false;
        }
      }

      // Create a section for chips and add to beginning of librarySections.
      // The chips will be converted to section's options
      librarySections.unshift({
        header: {
          chips
        }
      });

      // Menu (sorting options)
      if (header?.end_items) {
        librarySections[0].header.end_items = header.end_items;
      }

      const fullData = {
        sections: librarySections
      };

      const result = InnerTubeParser.parseFeed(fullData);

      // Convert tabs to option and add it to start items of the first 
      // section (the one we created with the chips)
      const tabsToOption = tabs && tabs.length > 1 ? InnerTubeParser.convertTabsToOption(tabs) : null;
      if (tabsToOption) {
        if (!result.sections[0].options) {
          result.sections[0].options = [];
        }
        result.sections[0].options.unshift(tabsToOption);
      }
      return result;
    }

    // Continuation results
    const data = page.continuation_contents;
    const fullData = {
      sections: [
        {
          ...(data || {}),
          isContinuation: true
        }
      ]
    };

    return InnerTubeParser.parseFeed(fullData);
  }
}

module.exports = LibraryModel;
