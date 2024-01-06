import BaseViewHandler from './BaseViewHandler';
import View from './View';
import jellyfin from '../../../JellyfinContext';
import { ModelType } from '../../../model';
import { EntityType } from '../../../entities';
import { RenderedList, RenderedPage, RenderedPageContents } from './ViewHandler';
import { GetCollectionItemsParams } from '../../../model/CollectionModel';
import { RenderedListItem } from './renderer/BaseRenderer';
import ViewHelper from './ViewHelper';

export interface CollectionView extends View {
  name: 'collection';
  parentId: string;
  itemType?: 'album' | 'artist' | 'playlist' | 'song';
}

export default class CollectionViewHandler extends BaseViewHandler<CollectionView> {

  async browse(): Promise<RenderedPage> {
    const baseUri = this.uri;
    const prevUri = this.constructPrevUri();
    const view = this.currentView;
    const collectionId = view.parentId;

    const listPromises: Promise<RenderedList>[] = [];
    if (view.itemType) {
      listPromises.push(this.#getList(collectionId, view.itemType, baseUri));
    }
    else {
      listPromises.push(
        this.#getList(collectionId, 'album', baseUri, true),
        this.#getList(collectionId, 'artist', baseUri, true),
        this.#getList(collectionId, 'playlist', baseUri, true),
        this.#getList(collectionId, 'song', baseUri, true)
      );
    }

    const lists = await Promise.all(listPromises);
    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      lists: lists.filter((list) => list?.items.length)
    };
    await this.setPageTitle(pageContents);

    return {
      navigation: pageContents
    };
  }

  async #getList(collectionId: string, itemType: Required<CollectionView>['itemType'], baseUri: string, inSection = false): Promise<RenderedList> {
    let entityType: EntityType;
    switch (itemType) {
      case 'album':
        entityType = EntityType.Album;
        break;
      case 'artist':
        entityType = EntityType.Artist;
        break;
      case 'playlist':
        entityType = EntityType.Playlist;
        break;
      case 'song':
      default:
        entityType = EntityType.Song;
        break;
    }
    const modelQueryParams: GetCollectionItemsParams = {
      ...this.getModelQueryParams(),
      itemType: entityType
    };
    if (inSection) {
      modelQueryParams.limit = jellyfin.getConfigValue('collectionInSectionItems');
    }

    let moreUri;
    if (inSection) {
      const collectionView: CollectionView = {
        name: 'collection',
        parentId: collectionId,
        itemType
      };
      moreUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(collectionView)}`;
    }
    else {
      moreUri = this.constructNextUri();
    }
    const title = jellyfin.getI18n(`JELLYFIN_${itemType.toUpperCase()}S`);

    const model = this.getModel(ModelType.Collection);
    const collectionItems = await model.getCollectionItems(modelQueryParams);
    const listItems = collectionItems.items.map((item) => {
      switch (item.type) {
        case EntityType.Album:
          return this.getRenderer(EntityType.Album).renderToListItem(item);
        case EntityType.Song:
          return this.getRenderer(EntityType.Song).renderToListItem(item);
        case EntityType.Artist:
          return this.getRenderer(EntityType.Artist).renderToListItem(item as any, { noParent: true });
        case EntityType.Playlist:
          return this.getRenderer(EntityType.Playlist).renderToListItem(item);
        default:
          return null;
      }
    }).filter((item) => item) as RenderedListItem[];

    if (collectionItems.nextStartIndex) {
      listItems.push(inSection ? this.constructNextPageItem(moreUri) : this.constructMoreItem(moreUri));
    }

    return {
      title,
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }
}
