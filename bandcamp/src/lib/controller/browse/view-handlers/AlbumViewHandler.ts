import bandcamp from '../../../BandcampContext';
import { ModelType } from '../../../model';
import UIHelper, { UILink } from '../../../util/UIHelper';
import { BandView } from './BandViewHandler';
import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedList, RenderedPage, RenderedPageContents } from './ViewHandler';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface AlbumView extends View {
  name: 'album';
  albumUrl: string;
  track?: string;
  // For explode track URIs (used by `goto()`)
  artistUrl?: string;
}

export default class AlbumViewHandler extends ExplodableViewHandler<AlbumView> {

  async browse(): Promise<RenderedPage> {
    const albumUrl = this.currentView.albumUrl;

    if (!albumUrl) {
      throw Error('Album URL missing');
    }

    return this.browseAlbum(albumUrl);
  }

  protected async browseAlbum(albumUrl: string) {
    const model = this.getModel(ModelType.Album);
    const albumRenderer = this.getRenderer(RendererType.Album);
    const trackRenderer = this.getRenderer(RendererType.Track);

    const albumInfo = await model.getAlbum(albumUrl);

    const trackItems = albumInfo.tracks?.reduce<RenderedListItem[]>((result, track) => {
      const parsed = trackRenderer.renderToListItem({...track, type: 'track'});
      if (parsed) {
        result.push(parsed);
      }
      return result;
    }, []);

    const header = albumRenderer.renderToHeader(albumInfo);

    const page: RenderedPage = {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: header,
        lists: [ {
          availableListViews: [ 'list' ],
          items: trackItems || []
        } ]
      }
    };

    await this.#addArtistLink(page.navigation, albumInfo.artist?.url);

    const link: UILink = {
      url: albumUrl,
      text: bandcamp.getI18n('BANDCAMP_VIEW_LINK_ALBUM'),
      icon: { type: 'bandcamp' },
      target: '_blank'
    };
    if (page.navigation?.lists) {
      if (page.navigation?.lists.length > 1) { // Artist link added
        page.navigation.lists[1].title = UIHelper.constructListTitleWithLink('', link, false);
      }
      else {
        page.navigation.lists[0].title = UIHelper.constructListTitleWithLink('', link, true);
      }
    }

    return page;
  }

  async #addArtistLink(nav?: RenderedPageContents, artistUrl?: string) {
    if (!nav || !artistUrl) {
      return;
    }

    // Check if we're coming from band view.
    // If not, include artist link.
    const comingFrom = this.previousViews[this.previousViews.length - 1]?.name;
    if (comingFrom !== 'band') {
      const model = this.getModel(ModelType.Band);
      const bandInfo = await model.getBand(artistUrl);
      if (!bandInfo.url) {
        return;
      }
      const bandView: BandView = {
        name: 'band',
        bandUrl: bandInfo.url
      };
      const artistLinkItem: RenderedListItem = {
        service: 'bandcamp',
        type: 'item-no-menu',
        icon: 'fa fa-user',
        title: bandcamp.getI18n('BANDCAMP_MORE_FROM', bandInfo.name),
        uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(bandView)}`
      };
      const linksList: RenderedList = {
        availableListViews: [ 'list' ],
        items: [ artistLinkItem ]
      };
      if (!nav.lists) {
        nav.lists = [];
      }
      nav.lists.unshift(linksList);
    }
  }

  async getTracksOnExplode() {
    const albumUrl = this.currentView.albumUrl;

    if (!albumUrl) {
      throw Error('No albumUrl specified');
    }

    const model = this.getModel(ModelType.Album);
    const albumInfo = await model.getAlbum(albumUrl);
    const albumTracks = albumInfo.tracks;
    const trackPosition = this.currentView.track;

    if (albumTracks && trackPosition) {
      return albumTracks[parseInt(trackPosition, 10) - 1] || [];
    }

    return albumTracks || [];
  }
}
