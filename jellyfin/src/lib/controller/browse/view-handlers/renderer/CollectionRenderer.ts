import Collection from '../../../../entities/Collection';
import { CollectionView } from '../CollectionViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

export default class CollectionRenderer extends BaseRenderer<Collection> {

  renderToListItem(data: Collection): RenderedListItem | null {
    const collectionView: CollectionView = {
      name: 'collection',
      parentId: data.id
    };

    return {
      service: 'jellyfin',
      type: 'streaming-category',
      title: data.name,
      artist: String(data.year),
      albumart: this.getAlbumArt(data),
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(collectionView)}`
    };
  }
}
