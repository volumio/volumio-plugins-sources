import { ModelType } from '../../../model';
import { type PageContent, type WatchContent, type WatchContinuationContent } from '../../../types/Content';
import {type BrowseContinuationEndpoint, type BrowseEndpoint, type WatchContinuationEndpoint, type WatchEndpoint} from '../../../types/Endpoint';
import MusicFolderViewHandler, { type MusicFolderView } from './MusicFolderViewHandler';

export interface PodcastView extends MusicFolderView {
  name: 'podcast'
}

export default class PodcastViewHandler extends MusicFolderViewHandler<PodcastView> {

  protected modelGetContents(endpoint: WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint |
    BrowseContinuationEndpoint): Promise<PageContent | WatchContent | WatchContinuationContent | null> {
    const model = this.getModel(ModelType.Endpoint);
    return model.getContents(endpoint);
  }
}
