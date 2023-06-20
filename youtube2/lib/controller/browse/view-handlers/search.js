'use strict';

const yt2 = require('../../../youtube2');
const GenericViewHandler = require('./generic');

class SearchViewHandler extends GenericViewHandler {

  // Override
  getEndpoint() {
    const view = this.getCurrentView();
    if (!view.continuation && !view.endpoint) {
      const query = view.query ? decodeURIComponent(view.query).trim() : '';
      if (query) {
        const endpoint = {
          type: 'search',
          payload: {
            query
          }
        };
        return endpoint;
      }
      return null;
    }

    return super.getEndpoint();
  }

  // Override
  async getContents() {
    const contents = await super.getContents();
    const view = this.getCurrentView();

    // There should be no header for search results. We can insert our title here.
    // If viewing continuation results, then the title would be in the continuationBundle.
    if (!view.continuation && !contents.header) {
      const query = this.getEndpoint()?.payload?.query;
      if (query) {
        contents.header = {
          title: yt2.getI18n('YOUTUBE2_SEARCH_TITLE', query)
        };
      }
    }

    if (contents?.sections && !view.continuation) {
      // Extract 'Showing Results For' endpoint item. If it exists, move it to its
      // own section.
      for (const section of contents.sections) {
        const showingResultsForItem = this._spliceShowingResultsFor(section);
        if (showingResultsForItem) {
          contents.sections.unshift({
            items: showingResultsForItem
          });
          break;
        }
      }
    }

    return contents;
  }

  _spliceShowingResultsFor(section) {
    if (!section.items?.length) {
      return null;
    }

    let spliced = null;
    section.items.some((item, itemIndex) => {
      if (item.type === 'section') {
        spliced = this._spliceShowingResultsFor(item);
      }
      else if (item.type === 'endpoint' && item.icon === 'YT2_SHOWING_RESULTS_FOR') {
        spliced = section.items.splice(itemIndex, 1);
      }
      return !!spliced;
    });

    return spliced;
  }
}

module.exports = SearchViewHandler;
