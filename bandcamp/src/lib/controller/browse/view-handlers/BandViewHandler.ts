import bandcamp from '../../../BandcampContext';
import TrackEntity from '../../../entities/TrackEntity';
import { ModelType } from '../../../model';
import { BandModelGetDiscographyParams, BandModelGetLabelArtistsParams } from '../../../model/BandModel';
import UIHelper, { UILink } from '../../../util/UIHelper';
import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface BandView extends View {
  name: 'band';
  bandUrl: string;
  view?: 'discography' | 'artists';
}

export default class BandViewHandler extends ExplodableViewHandler<BandView> {

  async browse(): Promise<RenderedPage> {
    const bandUrl = this.currentView.bandUrl;
    const bandInfo = await this.getModel(ModelType.Band).getBand(bandUrl);
    const header = this.getRenderer(RendererType.Band).renderToHeader(bandInfo);
    let backToList: RenderedList | null = null;
    if (bandInfo.type === 'artist' && bandInfo.label?.url) {
      // Check if we're coming from the label:
      // Label -> artist ; or
      // Label -> album -> artist
      const _getBackToUri = (labelUrl: string, matchLevel: number) => {
        const prevViews = this.previousViews;
        const viewToMatch = prevViews[prevViews.length - (matchLevel + 1)];
        if (viewToMatch && viewToMatch.name === 'band' && viewToMatch.bandUrl === labelUrl) {
          return ViewHelper.constructUriFromViews(prevViews.slice(0, prevViews.length - matchLevel));
        }
        return null;
      };

      let labelLinkListItem: RenderedListItem;
      const backToUri = _getBackToUri(bandInfo.label.url, 0) || _getBackToUri(bandInfo.label.url, 1);
      if (backToUri) {
        labelLinkListItem = {
          service: 'bandcamp',
          type: 'item-no-menu',
          title: bandcamp.getI18n('BANDCAMP_BACK_TO', bandInfo.label.name),
          uri: backToUri
        };
      }
      else {
        const bandView: BandView = {
          name: 'band',
          bandUrl: bandInfo.label.url
        };
        labelLinkListItem = {
          service: 'bandcamp',
          type: 'item-no-menu',
          title: bandInfo.label.name,
          uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(bandView)}`
        };
      }
      labelLinkListItem.icon = 'fa fa-link';

      backToList = {
        availableListViews: [ 'list' ],
        items: [ labelLinkListItem ]
      };
    }

    let contentLists: RenderedList[];
    switch (bandInfo.type) {
      case 'artist':
        contentLists = await this.#getContentListsForArtist(bandUrl);
        break;
      case 'label':
        contentLists = await this.#getContentListsForLabel(bandUrl);
        break;
      default:
        contentLists = [];
    }

    if (backToList) {
      contentLists.unshift(backToList);
    }

    const viewBandExternalLink: UILink = {
      url: bandUrl,
      text: this.#getViewLinkText(bandInfo.type),
      icon: { type: 'bandcamp' },
      target: '_blank'
    };

    if (contentLists.length > 1) {
      contentLists[1].title = UIHelper.constructListTitleWithLink(contentLists[1].title || '', viewBandExternalLink, false);
    }
    else {
      contentLists[0].title = UIHelper.constructListTitleWithLink(contentLists[0].title || '', viewBandExternalLink, true);
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: header,
        lists: contentLists
      }
    };
  }

  async #getContentListsForArtist(artistUrl: string) {
    return [ await this.#getDiscographyList(artistUrl) ];
  }

  async #getContentListsForLabel(labelUrl: string): Promise<RenderedList[]> {
    let contentsList;
    let viewLinkListItem: RenderedListItem;
    if (this.currentView.view === 'artists') {
      contentsList = await this.#getLabelArtistsList(labelUrl);
      const bandView: BandView = {
        name: 'band',
        bandUrl: labelUrl,
        view: 'discography'
      };
      viewLinkListItem = {
        service: 'bandcamp',
        type: 'item-no-menu',
        icon: 'fa fa-music',
        title: bandcamp.getI18n('BANDCAMP_DISCOGRAPHY'),
        uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(bandView)}`
      };
    }
    else {
      contentsList = await this.#getDiscographyList(labelUrl);
      const bandView: BandView = {
        name: 'band',
        bandUrl: labelUrl,
        view: 'artists'
      };
      viewLinkListItem = {
        service: 'bandcamp',
        type: 'item-no-menu',
        icon: 'fa fa-users',
        title: bandcamp.getI18n('BANDCAMP_LABEL_ARTISTS'),
        uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(bandView)}`
      };
    }
    const linksList: RenderedList = {
      availableListViews: [ 'list' ],
      items: [ viewLinkListItem ]
    };

    return [ linksList, contentsList ];
  }

  async #getDiscographyList(bandUrl: string): Promise<RenderedList> {
    const view = this.currentView;
    const model = this.getModel(ModelType.Band);
    const albumRenderer = this.getRenderer(RendererType.Album);
    const trackRenderer = this.getRenderer(RendererType.Track);

    const modelParams: BandModelGetDiscographyParams = {
      bandUrl,
      limit: bandcamp.getConfigValue('itemsPerPage', 47)
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    const discog = await model.getDiscography(modelParams);
    const listItems = discog.items.reduce<RenderedListItem[]>((result, discogItem) => {
      let rendered;
      if (discogItem.type === 'album') {
        rendered = albumRenderer.renderToListItem(discogItem);
      }
      else { // Track
        rendered = trackRenderer.renderToListItem(discogItem, true, true, false);
      }
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    const nextPageRef = this.constructPageRef(discog.nextPageToken, discog.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    return {
      title: bandcamp.getI18n('BANDCAMP_DISCOGRAPHY'),
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }

  async #getLabelArtistsList(labelUrl: string): Promise<RenderedList> {

    const modelParams: BandModelGetLabelArtistsParams = {
      labelUrl,
      limit: bandcamp.getConfigValue('itemsPerPage', 47)
    };

    if (this.currentView.pageRef) {
      modelParams.pageToken = this.currentView.pageRef.pageToken;
      modelParams.pageOffset = this.currentView.pageRef.pageOffset;
    }

    const artists = await this.getModel(ModelType.Band).getLabelArtists(modelParams);
    const artistRenderer = this.getRenderer(RendererType.Band);
    const listItems = artists.items.reduce<RenderedListItem[]>((result, artist) => {
      const rendered = artistRenderer.renderToListItem(artist);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    const nextPageRef = this.constructPageRef(artists.nextPageToken, artists.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    return {
      title: bandcamp.getI18n('BANDCAMP_LABEL_ARTISTS'),
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }

  #getViewLinkText(bandType: string) {
    switch (bandType) {
      case 'artist':
        return bandcamp.getI18n('BANDCAMP_VIEW_LINK_ARTIST');
      case 'label':
        return bandcamp.getI18n('BANDCAMP_VIEW_LINK_LABEL');
      default:
        return '';
    }
  }

  async getTracksOnExplode(): Promise<TrackEntity | TrackEntity[]> {
    const bandUrl = this.currentView.bandUrl;
    if (!bandUrl) {
      throw Error('Band URL is missing');
    }

    const modelParams: BandModelGetDiscographyParams = {
      limit: 1,
      bandUrl
    };

    const discog = await this.getModel(ModelType.Band).getDiscography(modelParams);
    const first = discog.items[0] || {};
    if (first.type === 'track' && first.url) {
      const trackModel = this.getModel(ModelType.Track);
      return trackModel.getTrack(first.url);
    }
    else if (first.type === 'album' && first.url) {
      const albumModel = this.getModel(ModelType.Album);
      const album = await albumModel.getAlbum(first.url);
      return album.tracks || [];
    }

    return [];

  }
}
