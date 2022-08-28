'use strict';

const { default: SectionList } = require("volumio-youtubei.js/dist/src/parser/classes/SectionList");
const { InnerTubeParser, InnerTubeBaseModel } = require("./innertube");

class PlaylistModel extends InnerTubeBaseModel {

  async getPlaylist(playlistId, opts) {
    if (opts?.continuation) {
      return this.getBrowseResultsByContinuation(opts.continuation);
    }

    const innerTube = this.getInnerTube();
    const playlist = await innerTube.music.getPlaylist(playlistId);
    const sectionList = playlist.page.contents_memo.getType(SectionList)?.[0];
    await this.expandSectionList(sectionList);

    const fullData = {
      header: InnerTubeParser.unwrapItem(playlist.header),
      sections: sectionList.contents
    };

    const result = InnerTubeParser.parseFeed(fullData, 'playlist');
    result.header.id = playlistId;

    // Fill empty sections with results fetched by contnuation, if any (e.g. Suggestions)
    const fillSectionPromises = [];
    for (const section of result.sections) {
      fillSectionPromises.push(this._fillSectionIfEmpty(section))
    }
    await Promise.all(fillSectionPromises);

    return result;
  }

  async _fillSectionIfEmpty(section) {
    if ((!section.contents || section.contents.length === 0) && section.continuation) {
      const continuationResult = await this.getBrowseResultsByContinuation({ token: section.continuation });
      section.contents = continuationResult.sections[0].contents;
      section.continuation = null;
    }
  }
}

module.exports = PlaylistModel;
