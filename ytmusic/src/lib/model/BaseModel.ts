import { IParsedResponse, Parser, SectionListContinuation, YTNodes } from 'volumio-youtubei.js';
import InnertubeLoader from './InnertubeLoader';

const MAX_APPEND_SECTIONS_COUNT = 10;

export abstract class BaseModel {

  protected getInnertube() {
    return InnertubeLoader.getInstance();
  }

  protected async expandSectionList(response: IParsedResponse, url: '/browse' | '/search') {
    const { innertube } = await this.getInnertube();
    const sectionLists = response.contents_memo?.getType(YTNodes.SectionList) || [];
    for (const sectionList of sectionLists) {
      let sectionListContinuation = sectionList.continuation;
      if (sectionList.continuation_type !== 'next') {
        sectionListContinuation = undefined;
      }
      let appendCount = 0;
      while (sectionListContinuation && appendCount < MAX_APPEND_SECTIONS_COUNT) {
        const response = await innertube.actions.execute(url, { token: sectionListContinuation, client: 'YTMUSIC' });
        const page = Parser.parseResponse(response.data);
        if (page.continuation_contents instanceof SectionListContinuation && page.continuation_contents.contents) {
          sectionList.contents.push(...page.continuation_contents.contents);
          sectionListContinuation = page.continuation_contents.continuation;
          appendCount++;
        }
        else {
          break;
        }
      }
      delete sectionList.continuation;
    }
  }
}
