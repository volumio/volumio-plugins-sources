import sc from '../../../SoundCloudContext';
import AlbumEntity from '../../../entities/AlbumEntity';
import PlaylistEntity from '../../../entities/PlaylistEntity';
import { ModelType } from '../../../model';
import { MeModelGetLibraryItemsParams } from '../../../model/MeModel';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';

export interface LibraryView extends View {
  name: 'library';
  type: 'album' | 'playlist' | 'station';
}

export default class LibraryViewHandler extends BaseViewHandler<LibraryView> {

  async browse(): Promise<RenderedPage> {
    const { type, pageRef } = this.currentView;
    const pageToken = pageRef?.pageToken;
    const pageOffset = pageRef?.pageOffset;
    const modelParams: MeModelGetLibraryItemsParams = {
      type,
      limit: sc.getConfigValue('itemsPerPage')
    };

    if (pageToken) {
      modelParams.pageToken = pageRef.pageToken;
    }
    if (pageOffset) {
      modelParams.pageOffset = pageRef.pageOffset;
    }

    const items = await this.getModel(ModelType.Me).getLibraryItems(modelParams);
    const page = this.buildPageFromLoopFetchResult(
      items,
      this.#getRenderer.bind(this),
      this.#getTitle()
    );

    return page;
  }

  #getRenderer(item: AlbumEntity | PlaylistEntity) {
    if (item.type === 'album') {
      return this.getRenderer(RendererType.Album);
    }
    else if (item.type === 'playlist' || item.type === 'system-playlist') {
      return this.getRenderer(RendererType.Playlist);
    }
    return null;
  }

  #getTitle() {
    const { type } = this.currentView;
    if (type === 'album') {
      return sc.getI18n('SOUNDCLOUD_ALBUMS');
    }
    else if (type === 'playlist') {
      return sc.getI18n('SOUNDCLOUD_PLAYLISTS');
    }
    else if (type === 'station') {
      return sc.getI18n('SOUNDCLOUD_STATIONS');
    }
    return undefined;
  }
}
