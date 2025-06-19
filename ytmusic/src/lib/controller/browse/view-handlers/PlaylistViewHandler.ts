import { ModelType } from '../../../model';
import { type PageContent, type WatchContent, type WatchContinuationContent } from '../../../types/Content';
import {type BrowseContinuationEndpoint, type BrowseEndpoint, type SearchContinuationEndpoint, type SearchEndpoint, type WatchContinuationEndpoint, type WatchEndpoint} from '../../../types/Endpoint';
import type Endpoint from '../../../types/Endpoint';
import { EndpointType } from '../../../types/Endpoint';
import EndpointHelper from '../../../util/EndpointHelper';
import MusicFolderViewHandler, { type MusicFolderView } from './MusicFolderViewHandler';

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
  protected getEndpoint(explode?: boolean  ): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
  protected getEndpoint(explode?: boolean  ): Endpoint | null {
    const endpoint = super.getEndpoint(explode);
    if (explode && EndpointHelper.isType(endpoint, EndpointType.Watch)) {
      // `PlaylistView.endpoints.watch` returns tracks in random order. Remove `params` from endpoint for default ordering.
      delete endpoint.payload.params;
    }
    return endpoint;
  }
}
