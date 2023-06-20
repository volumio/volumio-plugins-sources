import Innertube from 'volumio-youtubei.js';
import yt2 from '../YouTube2Context';

export abstract class BaseModel {

  protected getInnertube() {
    return yt2.get<Innertube>('innertube');
  }
}
