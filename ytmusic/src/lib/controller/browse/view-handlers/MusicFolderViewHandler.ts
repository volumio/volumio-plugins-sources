import ytmusic from '../../../YTMusicContext';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import EndpointHelper from '../../../util/EndpointHelper';
import GenericViewHandler, { GenericViewBase } from './GenericViewHandler';

export interface MusicFolderView extends GenericViewBase {
  name: string,
  endpoints: {
    browse: BrowseEndpoint;
    watch: WatchEndpoint;
  };
}

export default abstract class MusicFolderViewHandler<T extends MusicFolderView> extends GenericViewHandler<T> {

  protected async getContents(): Promise<PageContent> {
    const endpoint = this.assertEndpointExists(this.getEndpoint());
    if (EndpointHelper.isType(endpoint, EndpointType.Browse, EndpointType.BrowseContinuation)) {
      const contents = await this.modelGetContents(endpoint);
      return this.assertPageContents(contents);
    }
    ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_ENDPOINT_INVALID'));
    throw Error(ytmusic.getI18n('YTMUSIC_ERR_ENDPOINT_INVALID'));
  }

  protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
  protected getEndpoint(explode: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
  protected getEndpoint(explode?: boolean | undefined): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
  protected getEndpoint(explode?: boolean | undefined): Endpoint | null {
    const view = this.currentView;
    if (!view.continuation) {
      const endpoints = view.endpoints;
      return (explode ? endpoints.watch : endpoints.browse) || null;
    }
    return super.getEndpoint(explode);
  }

  protected abstract modelGetContents(endpoint: BrowseEndpoint | BrowseContinuationEndpoint | WatchEndpoint |
    WatchContinuationEndpoint): Promise<WatchContent | WatchContinuationContent | PageContent | null>;
}
