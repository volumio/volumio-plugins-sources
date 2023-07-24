import { Fan } from 'bandcamp-fetch';
import bandcamp from '../../../BandcampContext';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
import UIHelper, { UILink } from '../../../util/UIHelper';
import { FanModelGetFanItemsParams } from '../../../model/FanModel';
import ViewHelper from './ViewHelper';

export interface FanView extends View {
  name: 'fan';
  username: string;
  view?: 'collection' | 'wishlist' | 'followingArtistsAndLabels' | 'followingGenres';
}

export default class FanViewHandler extends BaseViewHandler<FanView> {

  browse(): Promise<RenderedPage> {
    if (!this.currentView.username) {
      throw Error('Username missing');
    }
    switch (this.currentView.view) {
      case 'collection':
      case 'wishlist':
      case 'followingArtistsAndLabels':
      case 'followingGenres':
        return this.#browseList();
      default:
        return this.#browseSummary();
    }
  }

  async #browseList(): Promise<RenderedPage> {
    const view = this.currentView;
    const modelParams: FanModelGetFanItemsParams = {
      username: view.username,
      limit: bandcamp.getConfigValue('itemsPerPage', 47)
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    let fanItems;
    const model = this.getModel(ModelType.Fan);
    switch (view.view) {
      case 'collection':
        fanItems = await model.getCollection(modelParams);
        break;
      case 'wishlist':
        fanItems = await model.getWishlist(modelParams);
        break;
      case 'followingArtistsAndLabels':
        fanItems = await model.getFollowingArtistsAndLabels(modelParams);
        break;
      case 'followingGenres':
        fanItems = await model.getFollowingGenres(modelParams);
        break;
      default:
        throw Error(`Unknown view type: ${view.view}`);
    }

    const albumRenderer = this.getRenderer(RendererType.Album);
    const trackRenderer = this.getRenderer(RendererType.Track);
    const bandRenderer = this.getRenderer(RendererType.Band);
    const tagRenderer = this.getRenderer(RendererType.Tag);

    const listItems: RenderedListItem[] = [];
    fanItems.items.forEach((item) => {
      let rendered;
      switch (item.type) {
        case 'album':
          rendered = albumRenderer.renderToListItem(item);
          break;
        case 'artistOrLabel':
          rendered = bandRenderer.renderToListItem(item);
          break;
        case 'tag':
          rendered = tagRenderer.renderGenreListItem(item);
          break;
        case 'track':
          rendered = trackRenderer.renderToListItem(item, true, true);
          break;
        default:
          rendered = null;
      }
      if (rendered) {
        listItems.push(rendered);
      }
    });

    const nextPageRef = this.constructPageRef(fanItems.nextPageToken, fanItems.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    const fanItemsList: RenderedList = {
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
    const fanInfo = await model.getInfo(view.username);
    const fanItemsListTitle = this.#getTitle(fanInfo);
    if (fanItemsListTitle) {
      fanItemsList.title = fanItemsListTitle;
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists: [ fanItemsList ]
      }
    };
  }

  async #browseSummary(): Promise<RenderedPage> {
    const username = this.currentView.username;
    const baseUri = this.uri;
    const baseImgPath = 'music_service/mpd/';
    const fanInfo = await this.getModel(ModelType.Fan).getInfo(username);
    const fanView: FanView = {
      name: 'fan',
      username
    };
    const summaryItems: RenderedListItem[] = [
      {
        'service': 'bandcamp',
        'type': 'item-no-menu',
        'title': bandcamp.getI18n('BANDCAMP_COLLECTION', fanInfo.collectionItemCount),
        'albumart': `/albumart?sourceicon=${baseImgPath}musiclibraryicon.png`,
        'uri': `${baseUri}/${ViewHelper.constructUriSegmentFromView({...fanView, view: 'collection'})}`
      },
      {
        'service': 'bandcamp',
        'type': 'item-no-menu',
        'title': bandcamp.getI18n('BANDCAMP_WISHLIST', fanInfo.wishlistItemCount),
        'albumart': `/albumart?sourceicon=${baseImgPath}favouritesicon.png`,
        'uri': `${baseUri}/${ViewHelper.constructUriSegmentFromView({...fanView, view: 'wishlist'})}`
      },
      {
        'service': 'bandcamp',
        'type': 'item-no-menu',
        'title': bandcamp.getI18n('BANDCAMP_FOLLOWING_ARTISTS_AND_LABELS', fanInfo.followingArtistsAndLabelsCount),
        'albumart': `/albumart?sourceicon=${baseImgPath}artisticon.png`,
        'uri': `${baseUri}/${ViewHelper.constructUriSegmentFromView({...fanView, view: 'followingArtistsAndLabels'})}`
      },
      {
        'service': 'bandcamp',
        'type': 'item-no-menu',
        'title': bandcamp.getI18n('BANDCAMP_FOLLOWING_GENRES', fanInfo.followingGenresCount),
        'albumart': `/albumart?sourceicon=${baseImgPath}genreicon.png`,
        'uri': `${baseUri}/${ViewHelper.constructUriSegmentFromView({...fanView, view: 'followingGenres'})}`
      }
    ];
    const summaryItemsList: RenderedList = {
      availableListViews: [ 'list', 'grid' ],
      items: summaryItems
    };
    const listTitle = this.#getTitle(fanInfo);
    if (listTitle) {
      summaryItemsList.title = listTitle;
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists: [ summaryItemsList ]
      }
    };
  }

  #getTitle(fanInfo: Fan) {
    if (!fanInfo.url) {
      return null;
    }
    const viewProfileLink: UILink = {
      url: fanInfo.url,
      text: bandcamp.getI18n('BANDCAMP_VIEW_LINK_MY_PROFILE'),
      icon: { type: 'fa', class: 'fa fa-user' },
      target: '_blank'
    };
    let titleKey;
    switch (this.currentView.view) {
      case 'collection':
        titleKey = 'BANDCAMP_MY_COLLECTION';
        break;
      case 'wishlist':
        titleKey = 'BANDCAMP_MY_WISHLIST';
        break;
      case 'followingArtistsAndLabels':
        titleKey = 'BANDCAMP_MY_FOLLOWING_ARTISTS_AND_LABELS';
        break;
      case 'followingGenres':
        titleKey = 'BANDCAMP_MY_FOLLOWING_GENRES';
        break;
      default:
        titleKey = 'BANDCAMP_MY_BANDCAMP';
    }
    const mainTitle = bandcamp.getI18n(titleKey);
    const secondaryTitle = fanInfo.location ?
      bandcamp.getI18n('BANDCAMP_MY_BANDCAMP_NAME_LOCATION', fanInfo.name, fanInfo.location) :
      fanInfo.name;

    return UIHelper.constructDoubleLineTitleWithImageAndLink({
      imgSrc: fanInfo.imageUrl,
      title: mainTitle,
      secondaryTitle,
      link: viewProfileLink
    });
  }
}
