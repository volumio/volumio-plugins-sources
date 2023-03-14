'use strict';

const yt2 = require('../youtube2');
const utils = require('../utils');
const EndpointModel = require('./endpoint');

class PlaylistModel extends EndpointModel {

  async getContents(endpoint) {
    const contents = await super.getContents(endpoint);
    const loadAll = yt2.getConfigValue('loadFullPlaylists', false);
    if (!loadAll || !contents) {
        return contents;
    }

    // Look for section with continuation - there should only be one, if any.
    const targetSection = this._findSectionWithContinuation(contents.sections);
    if (targetSection) {
      yt2.getLogger().info(`[youtube2] PlaylistModel is going to recursively fetch continuation items for playlist with endpoint: ${JSON.stringify(endpoint)}).`)
      const continuationItems = await this._getContinuationItems(targetSection.continuation);
      targetSection.items.push(...continuationItems);
      yt2.getLogger().info(`[youtube2] Total ${continuationItems.length} continuation items fetched. Total items in playlist: ${targetSection.items.length}.`)
      delete targetSection.continuation;
    }

    return contents;
  }

  async _getContinuationItems(continuation, recursive = true, currentItems = []) {
    const contents = await super.getContents(continuation.endpoint);

    // There should only be one section for playlist continuation items
    const targetSection = contents.sections?.[0];
    if (targetSection?.items) {
        currentItems.push(...targetSection.items);

        yt2.getLogger().info(`[youtube2] Fetched ${ targetSection.items.length } continuation items.`)

        if (recursive && targetSection.continuation) {
            await utils.sleep(utils.rnd(200, 400)); // Rate limit
            await this._getContinuationItems(targetSection.continuation, recursive, currentItems);
            delete targetSection.continuation;
        }
    }
    
    return currentItems;
  }
  
  _findSectionWithContinuation(sections) {
    if (!sections) {
      return null;
    }

    for (const section of sections) {
      if (section.continuation) {
        return section;
      }

      const nestedSections = section.items?.filter((item) => item.type === 'section');
      if (nestedSections?.length > 0) {
        const result = this._findSectionWithContinuation(nestedSections);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

}

module.exports = PlaylistModel;
