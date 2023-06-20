'use strict';

const yt2 = require('../../../youtube2');
const ExplodableViewHandler = require('./explodable');

/**
 * View handler for feed contents consisting of sections and optional header.
 */

class FeedViewHandler extends ExplodableViewHandler {

  async browse() {
    const contents = await this.getContents();

    this.applyContinuationBundle(contents);

    const header = this.getHeader(contents.header);
    const lists = [];

    contents?.sections?.forEach((section) => {
      lists.push(...this._sectionToLists(contents, section, header));
    });

    if (lists.length === 0) {
      lists.push({
        availableListViews: ['list'],
        items: []
      });
    }

    if (!lists[0].title && !header && contents.header?.title) {
      lists[0].title = contents.header.title;
    }

    const nav = {
      info: header,
      prev: {
        uri: this.constructPrevUri()
      },
      lists
    };

    if (contents.tabs) {
      const tabsToListItem = this.parseItemDataToListItem(this._createOptionFromTabs(contents.tabs));
      lists.unshift({
        availableListViews: ['list'],
        items: [tabsToListItem]
      });
    }

    return { navigation: nav };
  }

  _sectionToLists(contents, section, parsedContentsHeader) {
    const listsForSection = [];
    const isPlaylistContents = contents.header?.type === 'playlist';
    const continuationBundle = this.createContinuationBundle(contents, section);
    let hasNestedSections = false; // Talking about nested sections with actual contents

    // List: section main items
    const mainItems = [];
    section.items?.forEach((item) => {
      if (item.type === 'section') {
        const nestedSectionToLists = this._sectionToLists(contents, item, parsedContentsHeader);
        if (nestedSectionToLists.length > 0) {
          listsForSection.push(...this._sectionToLists(contents, item, parsedContentsHeader));
          hasNestedSections = true;
        }
      }
      else {
        const listItem = this.parseItemDataToListItem(item);
        if (listItem) {
          if (item.type === 'video' && !isPlaylistContents) {
            // Setting type to 'album' ensures only this item will get exploded when clicked. The exception
            // is when listing videos in a playlist.
            listItem.type = 'album';
          }
          mainItems.push(listItem);
        }
      }
    });

    if (mainItems.length > 0) {
      listsForSection.unshift({
        availableListViews: this.getAvailableListViews(section.items.filter((item) => item.type !== 'section')),
        items: mainItems
      });
    };

    // Section title
    const prevItemCount = this._getContinuationPrevItemCount();
    const currentItemCount = prevItemCount + mainItems.length;
    const showingResultsText = mainItems.length > 0 && (section.continuation || contents.type === 'continuation') && isPlaylistContents ?
      yt2.getI18n('YOUTUBE2_SHOWING_RESULTS', prevItemCount + 1, currentItemCount) : null;
    let sectionTitle = section.title;
    if (showingResultsText) {
      if (section.title) {
        sectionTitle = section.title + ' (' + showingResultsText.charAt(0).toLocaleLowerCase() + showingResultsText.substring(1) + ')';
      }
      else {
        sectionTitle = showingResultsText;
      }
    }

    if (section.continuation) {
      const continuationItem = this.constructContinuationItem({ continuation: section.continuation, prevItemCount: currentItemCount, continuationBundle });
      if (!hasNestedSections) {
        mainItems.push(continuationItem);
      }
      else {
        listsForSection.push({
          availableListViews: ['list'],
          items: [continuationItem]
        });
      }
    }

    const dataStartItems = [];
    const dataEndItems = [];

    // List: section start items
    // -- Filters
    if (continuationBundle.section?.filters) {
      // Check if selected filter has an endpoint and if none, set it to current.
      // (Targeting 'All' in Home, but maybe there are others as well)
      const view = this.getCurrentView();
      const currentViewEndpoint = view.endpoint ? JSON.parse(decodeURIComponent(view.endpoint)) : null;
      if (currentViewEndpoint) {
        continuationBundle.section.filters.forEach((filter) => {
          const selected = filter.optionValues.find((ov) => ov.selected);
          if (selected && !selected.endpoint) {
            selected.endpoint = currentViewEndpoint;
          }
        });
      }
      continuationBundle.section.filters.forEach((filter, index) => {
        dataStartItems.push(this._createOptionFromContinuationBundle(continuationBundle, `section.filters.${index}`));
      });
    }

    // -- Menus
    if (continuationBundle.section?.menus) {
      continuationBundle.section.menus.forEach((menu, index) => {
        dataStartItems.push(this._createOptionFromContinuationBundle(continuationBundle, `section.menus.${index}`));
      });
    }

    // -- Buttons
    if (continuationBundle.section?.buttons) {
      const targetItems = dataStartItems.length === 0 ? dataStartItems : dataEndItems;
      continuationBundle.section.buttons.forEach((button) => {
        const buttonEndpointItem = {
          type: 'endpoint',
          title: button.text,
          endpoint: button.endpoint
        };
        targetItems.push(buttonEndpointItem);
      });
    }

    const startItems = dataStartItems.reduce((parsed, data) => {
      const listItem = this.parseItemDataToListItem(data);
      if (listItem) {
        parsed.push(listItem);
      }
      return parsed;
    }, []);

    const endItems = dataEndItems.reduce((parsed, data) => {
      const listItem = this.parseItemDataToListItem(data);
      if (listItem) {
        parsed.push(listItem);
      }
      return parsed;
    }, []);

    if (startItems.length > 0) {
      listsForSection.unshift({
        availableListViews: ['list'],
        items: [...startItems]
      });
    }

    if (endItems.length > 0) {
      listsForSection.push({
        availableListViews: ['list'],
        items: [...endItems]
      });
    }

    // Set section title
    if (listsForSection.length > 0 && !listsForSection[0].title) {
      listsForSection[0].title = sectionTitle;
    }

    if (mainItems.length === 0 && !hasNestedSections && (sectionTitle || startItems.length > 0 || endItems.length > 0)) {
      listsForSection.push({
        title: sectionTitle,
        availableListViews: ['list'],
        items: []
      });
    }

    return listsForSection;
  }

  async getContents() {
    throw Error('No results');
  }

  getHeader(data) {
    if (!data) {
      return null;
    }

    const parser = this.getParser(data.type);
    if (parser) {
      return parser.parseToHeader(data);
    }
  }

  // Creates a bundle that passes to the next continuation of the specified section.
  // The bundle gets appended to the continuation uri and shall ultimately be passed
  // back to this handler, which will then apply the bundle to the continuation contents
  // before creating the view.
  createContinuationBundle(contents, section) {
    const bundle = {
      section: {
        title: section.title || null,
        filters: section.filters || null,
        menus: section.menus || null,
        buttons: section.buttons || null,
      },
      contents: {
        header: contents.header || null,
        tabs: contents.tabs || null,
      }
    };

    return bundle;
  }

  applyContinuationBundle(contents) {
    if (contents.type !== 'continuation') {
      return false;
    }

    const view = this.getCurrentView();
    const bundle = view.continuationBundle ? JSON.parse(decodeURIComponent(view.continuationBundle)) : null;

    if (!bundle || !contents) {
      return false;
    }

    if (bundle.contents?.header && !contents.header) {
      contents.header = bundle.contents.header;
    }

    if (bundle.contents?.tabs && !contents.tabs) {
      contents.tabs = bundle.contents.tabs;
    }

    if (bundle && contents?.sections) {
      const continuationSection = contents.sections[0];
      if (continuationSection) {
        const firstItemIsSection = continuationSection.items?.[0]?.type === 'section';
        if (bundle.section?.title && !firstItemIsSection && !continuationSection.title) {
          continuationSection.title = bundle.section.title;
        }
        if (bundle.section?.filters) {
          continuationSection.filters = bundle.section.filters;
        }
        if (bundle.section?.menus) {
          continuationSection.menus = bundle.section.menus;
        }
        if (bundle.section?.buttons) {
          continuationSection.buttons = bundle.section.buttons;
        }
      }
    }

    return true;
  }

  parseItemDataToListItem(data) {
    if (data.type === 'video') {
      return this.getParser(data.type)?.parseToListItem(data);
    }

    return this.getParser(data.type)?.parseToListItem(data);
  }

  getAvailableListViews(items) {
    // Note: Volumio only enforces availableListViews = ['list']. If a list is set to ['grid'], it can still be switched to list
    // if there are other switchable lists and the user clicks the switch view button.
    if (items.length === 0 || this._hasNoThumbnails(items)) {
      return ['list']
    }
    else if (items?.every((item) => item.type === 'channel')) {
      return ['grid'];
    }
    else {
      return ['list', 'grid'];
    }
  }

  _hasNoThumbnails(items) {
    return !items.find((item) => item.thumbnail);
  }

  _getContinuationPrevItemCount() {
    const view = this.getCurrentView();
    if (view.continuation) {
      const c = JSON.parse(decodeURIComponent(view.continuation));
      return c.prevItemCount || 0;
    }
    return 0;
  }

  _createOptionFromContinuationBundle(bundle, target) {
    return {
      type: 'option',
      fromContinuationBundle: true,
      continuationBundle: bundle,
      target
    };
  }

  _createOptionFromTabs(tabs) {
    return {
      type: 'option',
      optionValues: tabs
    };
  }

  findAllItemsInSection(target, predicate) {
    if (!target) {
      return [];
    }

    if (Array.isArray(target)) {
      return target.reduce((result, section) => {
        result.push(...this.findAllItemsInSection(section, predicate));
        return result;
      }, []);
    }

    const result = [];
    target.items?.forEach((item) => {
      if (item.type === 'section') {
        result.push(...this.findAllItemsInSection(item, predicate));
      }
      else if (typeof predicate !== 'function' || predicate(item)) {
        result.push(item);
      }
    });

    return result;
  }

  findAllEndpointsInSection(target, predicate) {
    if (!target) {
      return [];
    }

    if (Array.isArray(target)) {
      return target.reduce((result, section) => {
        result.push(...this.findAllEndpointsInSection(section, predicate));
        return result;
      }, []);
    }

    const result = [];
    ['filters', 'menus', 'buttons', 'items'].forEach((key) => {
      target[key]?.forEach((item) => {
        if (key === 'items' && item.type === 'section') {
          result.push(...this.findAllEndpointsInSection(item, predicate));
        }
        else if (item.endpoint && (typeof predicate !== 'function' || predicate(item.endpoint))) {
          result.push(item.endpoint);
        }
      });
    })

    return result;
  }
}

module.exports = FeedViewHandler;
