'use strict';

const { default: SectionList } = require("volumio-youtubei.js/dist/src/parser/classes/SectionList");
const { InnerTubeParser, InnerTubeBaseModel } = require("./innertube");

class RecapModel extends InnerTubeBaseModel {

  async getRecap() {
    const innerTube = this.getInnerTube();
    const recap = await innerTube.music.getRecap();
    const sectionList = recap.page.contents_memo.getType(SectionList)?.[0];
    await this.expandSectionList(sectionList);

    const fullData = {
      header: InnerTubeParser.unwrapItem(recap.page.header),
      // Strip first section since it contains only graphical elements that cannot be shown in Volumio UI
      sections: sectionList.contents?.slice(1) || []
    };

    return InnerTubeParser.parseFeed(fullData);
  }
}

module.exports = RecapModel;
