import InnertubeLoader from './InnertubeLoader';

export abstract class BaseModel {

  protected getInnertube() {
    return InnertubeLoader.getInstance();
  }
}
