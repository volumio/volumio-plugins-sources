'use strict';

const SectionList = require('volumio-youtubei.js').YTNodes.SectionList;
const { InnerTubeParser, InnerTubeBaseModel } = require("./innertube");
const Bottleneck = require('bottleneck');

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

    if (opts?.loadAll) {
      const mainSection = result.sections?.[0];
      await this._loadAllSectionContents(mainSection);
    }

    return result;
  }

  async _fillSectionIfEmpty(section) {
    if ((!section.contents || section.contents.length === 0) && section.continuation) {
      const continuationResult = await this.getBrowseResultsByContinuation({ token: section.continuation });
      section.contents = continuationResult.sections[0].contents;
      section.continuation = null;
    }
  }

  async _loadAllSectionContents(section) {
    if (!section?.contents) {
      return;
    }
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 333  // max 3 requests per second
    });
    while (section.continuation) {
      const fetchPromise = limiter.schedule(() => this.getBrowseResultsByContinuation({ token: section.continuation }));
      const continuationSection = (await fetchPromise)?.sections?.[0];
      if (continuationSection?.contents) {
        section.contents.push(...continuationSection.contents);
      }
      section.continuation = continuationSection?.continuation || null;
    }
  }
}

module.exports = PlaylistModel;
