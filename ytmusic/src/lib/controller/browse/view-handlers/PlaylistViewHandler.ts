import { ModelType } from '../../../model';
import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import EndpointHelper from '../../../util/EndpointHelper';
import MusicFolderViewHandler, { MusicFolderView } from './MusicFolderViewHandler';

export interface PlaylistView extends MusicFolderView {
  name: 'playlist'
}

export default class PlaylistViewHandler extends MusicFolderViewHandler<PlaylistView> {

  protected modelGetContents(endpoint: WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint |
    BrowseContinuationEndpoint): Promise<PageContent | WatchContent | WatchContinuationContent | null> {
    const model = this.getModel(ModelType.Playlist);
    return model.getContents(endpoint);
  }

  protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
  protected getEndpoint(explode: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
  protected getEndpoint(explode?: boolean | undefined): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
  protected getEndpoint(explode?: boolean | undefined): Endpoint | null {
    const endpoint = super.getEndpoint(explode);
    if (explode && EndpointHelper.isType(endpoint, EndpointType.Watch)) {
      // `PlaylistView.endpoints.watch` returns tracks in random order. Remove `params` from endpoint for default ordering.
      delete endpoint.payload.params;
    }
    return endpoint;
  }
}
