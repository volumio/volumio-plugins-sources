import ytmusic from '../../../YTMusicContext';
import { ModelType } from '../../../model';
import InnertubeLoader from '../../../model/InnertubeLoader';
import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import { AuthStatus } from '../../../util/Auth';
import AutoplayHelper from '../../../util/AutoplayHelper';
import EndpointHelper from '../../../util/EndpointHelper';
import ExplodeHelper from '../../../util/ExplodeHelper';
import FeedViewHandler, { FeedView } from './FeedViewHandler';

// From Innertube lib (YouTube.js#Actions)
const REQUIRES_SIGNIN_BROWSE_IDS = [
  'FEmusic_listening_review',
  'FEmusic_library_landing',
  'FEmusic_history'
];

export type GenericViewBase = FeedView;

export interface GenericView extends GenericViewBase {
  name: 'generic';
}

/**
 * Generic view handler. Contents fetched from endpoint with the EndpointModel.
 */

export default class GenericViewHandler<V extends GenericViewBase = GenericView> extends FeedViewHandler<V> {

  async browse() {
    const endpoint = this.getEndpoint();
    const { auth } = await InnertubeLoader.getInstance();

    if (EndpointHelper.isType(endpoint, EndpointType.Browse) &&
      REQUIRES_SIGNIN_BROWSE_IDS.includes(endpoint.payload.browseId) &&
      auth.getStatus().status !== AuthStatus.SignedIn) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_REQUIRE_SIGN_IN'));
      throw Error(ytmusic.getI18n('YTMUSIC_ERR_REQUIRE_SIGN_IN'));
    }

    return super.browse();
  }

  protected async getContents(): Promise<PageContent> {
    const endpoint = this.assertEndpointExists(this.getEndpoint());
    const contents = await this.getModel(ModelType.Endpoint).getContents(endpoint);
    return this.assertPageContents(contents);
  }

  protected assertEndpointExists<T extends Endpoint>(endpoint?: T | null): T {
    if (!endpoint) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_ENDPOINT_INVALID'));
      throw Error(ytmusic.getI18n('YTMUSIC_ERR_ENDPOINT_INVALID'));
    }
    return endpoint;
  }

  protected assertPageContents(content: PageContent | WatchContent | WatchContinuationContent | null): PageContent {
    if (content?.type !== 'page') {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_ENDPOINT_INVALID'));
      throw Error(`Expecting page contents, but got ${content?.type}`);
    }
    return content;
  }

  protected async getTracksOnExplode() {
    const endpoint = this.getEndpoint(true);

    if (!endpoint || !endpoint.payload) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_OP_NOT_SUPPORTED'));
      throw Error(ytmusic.getI18n('YTMUSIC_ERR_OP_NOT_SUPPORTED'));
    }

    const endpointPredicate = (endpoint: Endpoint): endpoint is WatchEndpoint => !!(EndpointHelper.isType(endpoint, EndpointType.Watch) && endpoint.payload?.playlistId);
    const model = this.getModel(ModelType.Endpoint);
    let targetWatchEndpoint: WatchEndpoint | null = null;

    if (EndpointHelper.isType(endpoint, EndpointType.Browse)) {
      let contents = await model.getContents(endpoint);
      let tabs = contents?.tabs || [];
      if (tabs.length > 1) {
        // Remaining tabs that can be used to look for watch endpoints
        tabs = tabs.filter((tab) => !tab.selected && EndpointHelper.isType(tab.endpoint, EndpointType.Browse));
      }
      while (!targetWatchEndpoint) {
        targetWatchEndpoint = this.findAllEndpointsInSection<WatchEndpoint>(contents?.sections, endpointPredicate)[0];
        if (!targetWatchEndpoint) {
          const nextTab = tabs.shift();
          if (nextTab && EndpointHelper.isType(nextTab.endpoint, EndpointType.Browse)) {
            contents = await model.getContents(nextTab.endpoint);
          }
          else {
            break;
          }
        }
      }
    }
    else if (endpointPredicate(endpoint)) {
      targetWatchEndpoint = endpoint;
    }

    if (!targetWatchEndpoint) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_NO_PLAYABLE_ITEMS_FOUND'));
      throw Error('No playable items found');
    }

    const contents = await model.getContents(targetWatchEndpoint);
    const musicItems = contents?.playlist?.items?.filter((item) => item.type === 'video' || item.type === 'song') || [];
    if (musicItems.length > 0) {
      const commonAutoplayContext = AutoplayHelper.getAutoplayContext(musicItems);
      musicItems.forEach((item) => {
        const autoplayContext = commonAutoplayContext || AutoplayHelper.getAutoplayContext(item);
        if (autoplayContext) {
          item.autoplayContext = autoplayContext;
        }
      });
    }

    const result = contents?.playlist?.items?.filter((item) => item.type === 'video' || item.type === 'song')
      .map((item) => ExplodeHelper.getExplodedTrackInfoFromMusicItem(item)) || [];

    return result;
  }

  protected getEndpoint(explode: true): BrowseEndpoint | WatchEndpoint | WatchContinuationEndpoint | null;
  protected getEndpoint(explode: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
  protected getEndpoint(explode?: boolean): BrowseEndpoint | BrowseContinuationEndpoint |
    SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint | WatchContinuationEndpoint | null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getEndpoint(explode?: boolean): Endpoint | null {
    const view = this.currentView;
    if (view.continuation) {
      return view.continuation.endpoint;
    }
    return view.endpoint || null;
  }
}
