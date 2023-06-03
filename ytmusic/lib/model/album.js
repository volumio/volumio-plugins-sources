'use strict';

const SectionList = require('volumio-youtubei.js').YTNodes.SectionList;
const { InnerTubeParser, InnerTubeBaseModel } = require("./innertube");

class AlbumModel extends InnerTubeBaseModel {

  async getAlbum(albumId) {
    const innerTube = this.getInnerTube();
    const album = await innerTube.music.getAlbum(albumId);
    const sectionList = album.page.contents_memo.getType(SectionList)?.[0];
    await this.expandSectionList(sectionList);

    const fullData = {
      header: InnerTubeParser.unwrapItem(album.header),
      sections: sectionList.contents
    };

    const result = InnerTubeParser.parseFeed(fullData, 'album');
    result.header.id = albumId;
    return result;
  }
}

module.exports = AlbumModel;
