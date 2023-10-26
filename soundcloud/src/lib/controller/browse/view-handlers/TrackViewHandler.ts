import sc from '../../../SoundCloudContext';
import { ModelType } from '../../../model';
import { TrackModelGetTracksParams } from '../../../model/TrackModel';
import ExplodableViewHandler, { ExplodedTrackInfo } from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';

export type TrackOrigin = {
  type: 'album';
  albumId: number;
} | {
  type: 'playlist';
  playlistId: number;
} | {
  type: 'system-playlist';
  playlistId: string;
  urn: string;
};

export interface TrackView extends View {
  name: 'tracks' | 'track';
  search?: string;
  userId?: string;
  topFeatured?: '1';
  myLikes?: '1';
  combinedSearch?: '1';
  title?: string;
  // Explode
  trackId?: string;
  origin?: TrackOrigin;
}

export default class TrackViewHandler extends ExplodableViewHandler<TrackView> {

  async browse(): Promise<RenderedPage> {
    const { pageRef, search, userId, topFeatured, myLikes, combinedSearch, inSection } = this.currentView;
    const pageToken = pageRef?.pageToken;
    const pageOffset = pageRef?.pageOffset;

    if (!search && userId === undefined && !topFeatured && !myLikes) {
      throw Error('Unknown criteria');
    }

    const modelParams: TrackModelGetTracksParams = {};

    if (pageToken) {
      modelParams.pageToken = pageRef.pageToken;
    }
    if (pageOffset) {
      modelParams.pageOffset = pageRef.pageOffset;
    }

    if (search) {
      modelParams.search = search;
    }
    else if (userId) {
      modelParams.userId = Number(userId);
    }
    else if (topFeatured) {
      modelParams.topFeatured = true;
    }

    if (search && combinedSearch) {
      modelParams.limit = sc.getConfigValue('combinedSearchResults');
    }
    else if (inSection) {
      modelParams.limit = sc.getConfigValue('itemsPerSection');
    }
    else {
      modelParams.limit = sc.getConfigValue('itemsPerPage');
    }

    let tracks;
    if (myLikes) {
      tracks = await this.getModel(ModelType.Me).getLikes({...modelParams, type: 'track'});
    }
    else {
      tracks = await this.getModel(ModelType.Track).getTracks(modelParams);
    }

    const page = this.buildPageFromLoopFetchResult(tracks, {
      renderer: this.getRenderer(RendererType.Track),
      title: myLikes ? sc.getI18n('SOUNDCLOUD_LIKES') : sc.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS')
    });

    if (userId && !inSection) {
      const userData = await this.getModel(ModelType.User).getUser(Number(userId));
      if (userData) {
        const header = this.getRenderer(RendererType.User).renderToHeader(userData);
        if (header && page.navigation) {
          page.navigation.info = header;
        }
      }
    }

    return page;
  }

  protected async getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]> {
    const { trackId, origin } = this.currentView;
    if (!trackId) {
      throw Error('No Track ID specified');
    }
    const track = await this.getModel(ModelType.Track).getTrack(Number(trackId));
    if (!track) {
      return [];
    }
    const explodedTrackInfo: ExplodedTrackInfo = {...track};
    if (origin) {
      explodedTrackInfo.origin = origin;
    }

    return explodedTrackInfo;
  }
}
