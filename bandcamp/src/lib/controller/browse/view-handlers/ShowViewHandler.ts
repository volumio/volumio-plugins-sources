import bandcamp from '../../../BandcampContext';
import TrackEntity from '../../../entities/TrackEntity';
import { ModelType } from '../../../model';
import { ShowModelGetShowsParams } from '../../../model/ShowModel';
import UIHelper, { UILink } from '../../../util/UIHelper';
import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface ShowView extends View {
  name: 'show';
  showUrl: string;
  view?: 'albums' | 'tracks';
}

interface ShowExplodeTrack extends TrackEntity {
  showUrl: string;
}

export default class ShowViewHandler extends ExplodableViewHandler<ShowView> {

  async browse(): Promise<RenderedPage> {
    const showUrl = this.currentView.showUrl;
    if (showUrl) {
      return this.#browseShow(showUrl);
    }

    return this.#browseAllShows();
  }

  async #browseAllShows(): Promise<RenderedPage> {
    const view = this.currentView;

    const modelParams: ShowModelGetShowsParams = {
      limit: view.inSection ? bandcamp.getConfigValue('itemsPerSection', 5) : bandcamp.getConfigValue('itemsPerPage', 47)
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    const shows = await this.getModel(ModelType.Show).getShows(modelParams);
    const showRenderer = this.getRenderer(RendererType.Show);
    const listItems = shows.items.reduce<RenderedListItem[]>((result, show) => {
      const rendered = showRenderer.renderToListItem(show);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    const nextPageRef = this.constructPageRef(shows.nextPageToken, shows.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists: [ {
          title: UIHelper.addBandcampIconToListTitle(bandcamp.getI18n(view.inSection ? 'BANDCAMP_SHOWS_SHORT' : 'BANDCAMP_SHOWS')),
          availableListViews: [ 'list', 'grid' ],
          items: listItems
        } ]
      }
    };
  }

  async #browseShow(showUrl: string): Promise<RenderedPage> {
    const view = this.currentView;
    const trackModel = this.getModel(ModelType.Track);
    const allLists: RenderedList[] = [];

    const show = await this.getModel(ModelType.Show).getShow(showUrl);
    const showRenderer = this.getRenderer(RendererType.Show);
    const showListItem = showRenderer.renderToListItem(show, true);
    if (showListItem) {
      const viewShowExternalLink: UILink = {
        url: showUrl,
        text: bandcamp.getI18n('BANDCAMP_VIEW_LINK_SHOW'),
        icon: { type: 'bandcamp' },
        target: '_blank'
      };
      const playFullStreamLinkList: RenderedList = {
        title: UIHelper.constructListTitleWithLink('', viewShowExternalLink, true),
        availableListViews: [ 'list' ],
        items: [ showListItem ]
      };
      allLists.push(playFullStreamLinkList);
    }

    if (view.view === 'albums') {
      const albumRenderer = this.getRenderer(RendererType.Album);
      const trackRenderer = this.getRenderer(RendererType.Track);
      const switchViewLinkData = {
        uri: this.#constructUriWithParams({ view: 'tracks', noExplode: 1 }),
        text: bandcamp.getI18n('BANDCAMP_SHOW_FEATURED_TRACKS')
      };
      const switchViewLink: UILink = {
        url: '#',
        text: switchViewLinkData.text,
        onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${switchViewLinkData.uri}'}, true)`,
        icon: {
          type: 'fa',
          class: 'fa fa-arrow-circle-right',
          float: 'right',
          color: '#54c688'
        }
      };
      const featuredAlbumsList: RenderedList = {
        title: UIHelper.constructListTitleWithLink(bandcamp.getI18n('BANDCAMP_TRACK_SOURCES'), switchViewLink, false),
        availableListViews: [ 'list', 'grid' ],
        items: []
      };

      const _fetchAlbumOrTrackPromise = async (track: TrackEntity) => {
        if (track.album) {
          return track.album;
        }
        else if (track.url) {
          try {
            return await trackModel.getTrack(track.url);
          }
          catch (error: any) {
            return null;
          }
        }
        return null;
      };

      const fetchAlbumOrTrackPromises = show.tracks?.map((track) => _fetchAlbumOrTrackPromise(track)) || [];

      const fetchedAlbumsOrTracks = (await Promise.all(fetchAlbumOrTrackPromises));
      const albumsAdded: string[] = [];

      fetchedAlbumsOrTracks.forEach((item) => {
        if (!item?.url) {
          return true;
        }
        if (item.type === 'track') {
          const rendered = trackRenderer.renderToListItem(item, true, true);
          if (rendered) {
            featuredAlbumsList.items.push(rendered);
          }
        }
        else if (item.type === 'album' && !albumsAdded.includes(item.url)) {
          const rendered = albumRenderer.renderToListItem(item);
          if (rendered) {
            featuredAlbumsList.items.push(rendered);
            albumsAdded.push(item.url);
          }
        }
      });

      allLists.push(featuredAlbumsList);
      this.#checkAndAddSwitchViewListItem(switchViewLinkData, allLists);
    }
    else {
      const trackRenderer = this.getRenderer(RendererType.Track);
      const switchViewLinkData = {
        uri: this.#constructUriWithParams({ view: 'albums', noExplode: 1 }),
        text: bandcamp.getI18n('BANDCAMP_SHOW_TRACK_SOURCES')
      };
      const switchViewLink: UILink = {
        url: '#',
        text: switchViewLinkData.text,
        onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${switchViewLinkData.uri}'}, true)`,
        icon: {
          type: 'fa',
          class: 'fa fa-arrow-circle-right',
          float: 'right',
          color: '#54c688'
        }
      };
      const featuredTracksList: RenderedList = {
        title: UIHelper.constructListTitleWithLink(bandcamp.getI18n('BANDCAMP_FEATURED_TRACKS'), switchViewLink, false),
        availableListViews: [ 'list' ],
        items: []
      };
      const fetchTrackPromises = show.tracks?.map(async (track) => {
        try {
          if (track.url) {
            return await trackModel.getTrack(track.url);
          }
          return null;
        }
        catch (error: any) {
          return null;
        }
      });
      const tracks = fetchTrackPromises ? await Promise.all(fetchTrackPromises) : [];

      tracks.forEach((track) => {
        if (track) {
          const rendered = trackRenderer.renderToListItem(track);
          if (rendered) {
            featuredTracksList.items.push(rendered);
          }
        }
      });
      allLists.push(featuredTracksList);
      this.#checkAndAddSwitchViewListItem(switchViewLinkData, allLists);
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: showRenderer.renderToHeader(show),
        lists: allLists
      }
    };
  }

  #constructUriWithParams(params: object) {
    const targetView = {
      ...this.currentView,
      ...params
    };
    return ViewHelper.constructUriFromViews([
      ...this.previousViews,
      targetView
    ]);
  }

  #checkAndAddSwitchViewListItem(linkData: { uri: string; text: string }, allLists: RenderedList[]) {
    if (!UIHelper.supportsEnhancedTitles()) {
      // Compensate for loss of switch view link
      const switchViewListItem: RenderedListItem = {
        service: 'bandcamp',
        type: 'item-no-menu',
        uri: linkData.uri,
        title: linkData.text,
        icon: 'fa fa-arrow-circle-right'
      };
      allLists.push({
        availableListViews: [ 'list' ],
        items: [ switchViewListItem ]
      });
    }
    return allLists;
  }

  async getTracksOnExplode(): Promise<ShowExplodeTrack | ShowExplodeTrack[]> {
    const showUrl = this.currentView.showUrl;
    if (!showUrl) {
      throw Error('Show URL missing');
    }

    const show = await this.getModel(ModelType.Show).getShow(showUrl);
    return {
      type: 'track',
      name: show.name,
      streamUrl: show.streamUrl,
      thumbnail: show.thumbnail,
      artist: {
        type: 'artist',
        name: UIHelper.reformatDate(show.date)
      },
      album: {
        type: 'album',
        name: bandcamp.getI18n('BANDCAMP_HEADER_SHOW')
      },
      showUrl: show.url
    };
  }

  /**
   * Override
   *
   * Track uri:
   * bandcamp/show@showUrl={showUrl}
   */
  getTrackUri(track: ShowExplodeTrack) {
    const showView: ShowView = {
      name: 'show',
      showUrl: track.showUrl
    };
    return `bandcamp/${ViewHelper.constructUriSegmentFromView(showView)}`;
  }
}
