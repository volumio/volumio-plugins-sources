'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const ExplodableViewHandler = require(__dirname + '/explodable');

/**
 * View handler for feed contents consisting of sections and optional header.
 */

class FeedViewHandler extends ExplodableViewHandler {

  #continuationBundle;
  #moreContentBundle;

  browse() {
    const defer = libQ.defer();

    this.getContents().then((contents) => {
      this.applyContinuationBundle(contents) || this.applyMoreContentBundle(contents);

      const header = this.getHeader(contents);
      const lists = [];

      contents?.sections?.forEach((section, sectionIndex) => {
        const listsForSection = [];
        const hasSongsAndVideosOnly = this._hasSongsAndVideosOnly(section.contents);

        // List: section main items
        const mainItems = section.contents?.reduce((parsed, data) => {
          const listItem = this.parseItemDataToListItem(data, sectionIndex, contents);
          if (listItem) {
            if (!hasSongsAndVideosOnly && (data.type === 'song' || data.type === 'video')) {
              // Force song or video in a list of mixed item types to 'album', so that if 
              // it is clicked, the other items won't get exploded as well.
              listItem.type = 'album';
            }
            parsed.push(listItem);
          }
          return parsed;
        }, []) || [];

        // Section title
        const prevItemCount = this._getContinuationPrevItemCount();
        const currentItemCount = prevItemCount + mainItems.length;
        const baseSectionTitle = this._getBaseSectionTitle(sectionIndex, contents, header);
        const showingResultsText = mainItems.length > 0 && (section.continuation || section.isContinuation) ? 
          ytmusic.getI18n('YTMUSIC_SHOWING_RESULTS', prevItemCount + 1, currentItemCount) : null;
        let sectionTitle = baseSectionTitle;
        if (showingResultsText) {
          if (baseSectionTitle) {
            sectionTitle = baseSectionTitle + ' (' + showingResultsText.charAt(0).toLocaleLowerCase() + showingResultsText.substring(1) + ')';
          }
          else {
            sectionTitle = showingResultsText;
          }
        }

        if (mainItems.length > 0) {
          // Note: Volumio only enforces availableListViews = ['list']. If a list is set to ['grid'], it can still be switched to list
          // if there are other switchable lists and the user clicks the switch view button.
          let listView = this.getAvailableListViews(sectionIndex, contents);
          if (!listView) {
            if (section.contents?.every((item) => item.type === 'artist')) {
              listView = ['grid'];
            }
            else if (section.contents?.every((item) => item.displayHint === 'list') || this._hasNoThumbnails(section.contents)) {
              listView = ['list'];
            }
            else if (section.contents?.every((item) => item.displayHint === 'grid')) {
              listView = ['grid'];
            }
            else {
              listView = ['list', 'grid'];
            }
          }
          listsForSection.push({
            availableListViews: listView,
            items: mainItems
          });
        }
      
        // List: section start items (including options)
        const startItemsToParse = [
          ...(section.options || []),
          ...(section.startItems || [])
        ];
        
        const startItems = startItemsToParse.reduce((parsed, data) => {
          const listItem = this.parseItemDataToListItem(data, sectionIndex, contents);
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

        // List: section end items
        const endItems = section.endItems?.reduce((parsed, data) => {
          const listItem = this.parseItemDataToListItem(data, sectionIndex, contents);
          if (listItem) {
            parsed.push(listItem);
          }
          return parsed;
        }, []) || [];

        if (endItems.length > 0) {
          listsForSection.push({
            availableListViews: ['list'],
            items: [...endItems]
          });
        }

        // Finalize section main items - add more / continuation
        if (mainItems.length > 0) {
          if (section.moreContent) {
            const moreContentBundle = this.createMoreContentBundle(sectionIndex, contents);
            const moreItem = this.getParser('moreItem').parseToListItem(section.moreContent, moreContentBundle);
            if (moreItem) {
              mainItems.push(moreItem);
            } 
          }
          else if (section.continuation) {
            const bundle = section.isContinuation ? this.getContinuationBundle() : this.createContinuationBundle(sectionIndex, contents);
            const continuationItem = this.constructContinuationItem({ token: section.continuation, prevItemCount: currentItemCount }, bundle);
            mainItems.push(continuationItem);
          }
        }
        
        // Set section title
        if (listsForSection.length > 0) {
          listsForSection[0].title = sectionTitle;
        }
        else {
          listsForSection.push({
            title: sectionTitle,
            availableListViews: ['list'],
            items: []
          });
        }

        lists.push(...listsForSection);
      });

      const nav = {
        info: header,
        prev: {
          uri: this.constructPrevUri()
        },
        lists
      };

      defer.resolve({ navigation: nav });
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }

  async getContents() {
    throw new Error('No results');
  }

  getHeader(contents) {
    if (contents.header) {
      const parser = this.getParser(contents.header.type);
      if (parser) {
        return parser.parseToHeader(contents.header);
      }
    }

    return null;
  }

  // Creates a bundle that persists across continuations in the section.
  // The bundle gets appended to the continuation uri and shall ultimately be passed
  // back to this handler, which will then apply the bundle to the continuation contents
  // before creating the view.
  createContinuationBundle(sectionIndex, contents) {
    const section = contents.sections[sectionIndex];
    const bundle = {
      section: {
        header: section.header || null,
        title: section.title || null,
        options: section.options || null,
        startItems: section.startItems || null,
        endItems: section.endItems || null,
      },
      contents: {
        header: contents.header || null,
        title: contents.title || null,
        sectionsBefore: null,
        sectionsAfter: null
      }
    };

    return bundle;
  }

  // Like createContinuationBundle(), but applies to moreContent items. However, unlike 
  // continuation bundles, they do not persist across subsequent moreContent clicks. Each 
  // time a moreContent item is encountered, a new bundle is created.
  // Currently, only the contents header and title are carried over.
  createMoreContentBundle(sectionIndex, contents) {
    const bundle = {
      contents: {
        header: contents.header || null,
        title: contents.title || null
      }
    };

    return bundle;
  }

  getMoreContentBundle() {
    if (this.#moreContentBundle === undefined) {
      const view = this.getCurrentView();
      this.#moreContentBundle = view.moreContentBundle ? JSON.parse(decodeURIComponent(view.moreContentBundle)) : null;
    }
    return this.#moreContentBundle;
  }

  getContinuationBundle() {
    if (this.#continuationBundle === undefined) {
      const view = this.getCurrentView();
      this.#continuationBundle = view.continuationBundle ? JSON.parse(decodeURIComponent(view.continuationBundle)) : null;
    }
    return this.#continuationBundle;
  }

  applyContinuationBundle(contents) {
    const bundle = this.getContinuationBundle();
    if (!bundle || !contents) {
      return false;
    }

    if (bundle.contents?.header && !contents.header) {
      contents.header = bundle.contents.header;
    }
    if (bundle.contents?.title && !contents.title) {
      contents.title = bundle.contents.title;
    }
    if (bundle && contents?.sections) {
      const continuationSection = contents.sections.find((section) => section.isContinuation);
      if (continuationSection) {
        if (bundle.contents?.sectionsBefore) {
          contents.sections.unshift(...bundle.contents.sectionsBefore);
        }
        if (bundle.contents?.sectionsAfter) {
          contents.sections.push(...bundle.contents.sectionsAfter)
        }
        ['options', 'startItems', 'endItems'].forEach((key) => {
          if (bundle.section?.[key]) {
            continuationSection[key] = [...bundle.section[key], ...(continuationSection[key] || [])];
          }  
        });
        ['header', 'title'].forEach((key) => {
          if (bundle.section?.[key] && !continuationSection[key]) {
            continuationSection[key] = bundle.section[key];
          }  
        })
      }
    }

    return true;
  }

  applyMoreContentBundle(contents) {
    const bundle = this.getMoreContentBundle();
    if (!bundle || !contents) {
      return false;
    }

    if (bundle.contents?.header && !contents.header) {
      contents.header = bundle.contents.header;
    }
    if (bundle.contents?.title && !contents.title) {
      contents.title = bundle.contents.title;
    }

    return true;
  }

  parseItemDataToListItem(data, sectionIndex, contents) {
    return this.getParser(data.type)?.parseToListItem(data);
  }

  getAvailableListViews(sectionIndex, contents) {
    return null;
  }

  _hasSongsAndVideosOnly(items) {
    return !items?.find((item) => item.type !== 'song' && item.type !== 'video');
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

  _getBaseSectionTitle(sectionIndex, contents, header) {
    const section = contents.sections[sectionIndex];
    let title = null;
    if (section.strapline) {
      title = section.title ? `${section.strapline}: ${section.title}` : section.strapline;
    }
    else {
      title = section.title;
    }
    if (!title && sectionIndex === 0 && contents.title && (!header || header.title !== contents.title)) {
      title = contents.title;
    }
    return title;
  }
}

module.exports = FeedViewHandler;
