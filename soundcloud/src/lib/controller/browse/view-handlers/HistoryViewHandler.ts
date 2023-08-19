import sc from '../../../SoundCloudContext';
import AlbumEntity from '../../../entities/AlbumEntity';
import PlaylistEntity from '../../../entities/PlaylistEntity';
import TrackEntity from '../../../entities/TrackEntity';
import { ModelType } from '../../../model';
import { HistoryModelGetPlayHistoryItemsParams } from '../../../model/HistoryModel';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import ViewHandlerFactory from './ViewHandlerFactory';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';

export interface HistoryView extends View {
  name: 'history';
  type?: 'set' | 'track';
}

export default class HistoryViewHandler extends BaseViewHandler<HistoryView> {

  async browse(): Promise<RenderedPage> {
    const { type, inSection } = this.currentView;

    if (type) {
      return this.#browseType(type, !!inSection);
    }

    const setsView: HistoryView = {
      name: 'history',
      type: 'set',
      inSection: '1'
    };
    const setsUri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(setsView, true)}`;

    const tracksView: HistoryView = {
      name: 'history',
      type: 'track',
      inSection: '1'
    };
    const tracksUri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(tracksView, true)}`;

    const pages = await Promise.all([
      ViewHandlerFactory.getHandler(setsUri).browse(),
      ViewHandlerFactory.getHandler(tracksUri).browse()
    ]);

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists: [
          ...(pages[0].navigation?.lists || []),
          ...(pages[1].navigation?.lists || [])
        ]
      }
    };
  }

  async #browseType(type: 'set' | 'track', inSection: boolean) {
    const { pageRef } = this.currentView;
    const pageToken = pageRef?.pageToken;
    const pageOffset = pageRef?.pageOffset;
    const modelParams: HistoryModelGetPlayHistoryItemsParams = { type };

    if (pageToken) {
      modelParams.pageToken = pageRef.pageToken;
    }
    if (pageOffset) {
      modelParams.pageOffset = pageRef.pageOffset;
    }

    if (inSection) {
      modelParams.limit = sc.getConfigValue('itemsPerSection');
    }
    else {
      modelParams.limit = sc.getConfigValue('itemsPerPage');
    }

    const items = await this.getModel(ModelType.History).getPlayHistory(modelParams);
    const page = this.buildPageFromLoopFetchResult(items, {
      getRenderer: this.#getRenderer.bind(this),
      title: type === 'track' ? sc.getI18n('SOUNDCLOUD_LIST_TITLE_RECENTLY_PLAYED_TRACKS') : sc.getI18n('SOUNDCLOUD_LIST_TITLE_RECENTLY_PLAYED')
    });

    return page;
  }

  #getRenderer(item: AlbumEntity | PlaylistEntity | TrackEntity) {
    if (item.type === 'album') {
      return this.getRenderer(RendererType.Album);
    }
    else if (item.type === 'playlist' || item.type === 'system-playlist') {
      return this.getRenderer(RendererType.Playlist);
    }
    else if (item.type === 'track') {
      return this.getRenderer(RendererType.Track);
    }
    return null;
  }
}
