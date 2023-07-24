import bandcamp from '../../../BandcampContext';
import { ModelType } from '../../../model';
import UIHelper, { UILink } from '../../../util/UIHelper';
import { AlbumView } from './AlbumViewHandler';
import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import ViewHandlerFactory from './ViewHandlerFactory';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface TrackView extends View {
  name: 'track';
  trackUrl: string;
  // For explode track URIs (used by `goto()`)
  artistUrl?: string;
  albumUrl?: string;
}

export default class TrackViewHandler extends ExplodableViewHandler<TrackView> {

  async browse(): Promise<RenderedPage> {
    const trackUrl = this.currentView.trackUrl;

    if (!trackUrl) {
      throw Error('Track URL missing');
    }

    return this.#browseTrack(trackUrl);
  }

  async #browseTrack(trackUrl: string): Promise<RenderedPage> {
    const trackInfo = await this.getModel(ModelType.Track).getTrack(trackUrl);
    if (trackInfo.album?.url) {
      const albumView: AlbumView = {
        name: 'album',
        albumUrl: trackInfo.album.url
      };
      const albumViewUri = ViewHelper.constructUriFromViews([
        ...this.previousViews,
        albumView
      ]);
      const albumViewHandler = ViewHandlerFactory.getHandler(albumViewUri);
      return albumViewHandler.browse();
    }

    const trackRenderer = this.getRenderer(RendererType.Track);
    const rendered = trackRenderer.renderToListItem(trackInfo);
    const listItems: RenderedListItem[] = rendered ? [ rendered ] : [];
    const viewTrackExternalLink: UILink = {
      url: trackUrl,
      text: bandcamp.getI18n('BANDCAMP_VIEW_LINK_TRACK'),
      icon: { type: 'bandcamp' },
      target: '_blank'
    };

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: trackRenderer.renderToHeader(trackInfo),
        lists: [
          {
            title: UIHelper.constructListTitleWithLink('', viewTrackExternalLink, true),
            availableListViews: [ 'list' ],
            items: listItems
          }
        ]
      }
    };
  }

  getTracksOnExplode() {
    const trackUrl = this.currentView.trackUrl;
    if (!trackUrl) {
      throw Error('Track URL missing');
    }

    return this.getModel(ModelType.Track).getTrack(trackUrl);
  }
}
