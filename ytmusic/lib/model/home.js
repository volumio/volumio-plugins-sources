'use strict';

const { default: SectionList } = require("volumio-youtubei.js/dist/src/parser/classes/SectionList");
const { InnerTubeParser, InnerTubeBaseModel } = require("./innertube");

class HomeModel extends InnerTubeBaseModel {

  async getFeed() {
    const feed = await this._innerTubeGetFeed();
    const sectionList = feed.page.contents_memo.getType(SectionList)?.[0];
    await this.expandSectionList(sectionList);

    const fullData = {
      header: InnerTubeParser.unwrapItem(feed.page.header),
      sections: sectionList.contents
    };

    return InnerTubeParser.parseFeed(fullData);
  }

  async _innerTubeGetFeed() {
    const innerTube = this.getInnerTube();
    return innerTube.music.getHomeFeed();
  }
}

module.exports = HomeModel;
