import bandcamp from '../../../BandcampContext';
import type TagEntity from '../../../entities/TagEntity';
import { ModelType } from '../../../model';
import UIHelper, { UI_STYLES } from '../../../util/UIHelper';
import type View from './View';
import { type RenderedList, type RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { type RenderedListItem } from './renderers/BaseRenderer';
import TrackEntity from '../../../entities/TrackEntity';
import ExplodableViewHandler from './ExplodableViewHandler';
import { AlbumView } from './AlbumViewHandler';
import { TrackView } from './TrackViewHandler';
import BaseViewHandler from './BaseViewHandler';

const FILTER_ICONS: Record<string, string> = {
  sort: 'fa fa-sort',
  location: 'fa fa-map-marker',
  format: 'fa fa-archive'
};
const FILTER_NAMES = [ 'format', 'location', 'sort' ];

export interface TagView extends View {
  name: 'tag';
  tagUrl: string;
  select?: string;
}

export default class TagViewHandler extends BaseViewHandler<TagView> {

  async browse(): Promise<RenderedPage> {
    return this.#browseTags();
  }

  async #browseTags(): Promise<RenderedPage> {
    const tags = await this.getModel(ModelType.Tag).getTags();
    const lists = [
      this.#getTagsList(tags, 'tags', bandcamp.getI18n('BANDCAMP_TAGS'), 'fa fa-tag'),
      this.#getTagsList(tags, 'locations', bandcamp.getI18n('BANDCAMP_LOCATIONS'), 'fa fa-map-marker')
    ];

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #getTagsList(tags: Record<string, TagEntity[]>, key: string, title: string, icon: string): RenderedList {
    const tagRenderer = this.getRenderer(RendererType.Tag);
    const listItems = tags[key].reduce<RenderedListItem[]>((result, tag) => {
      const rendered = tagRenderer.renderToListItem(tag);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    return {
      title: UIHelper.addIconToListTitle(icon, title),
      availableListViews: [ 'list' ],
      items: listItems
    };
  }

  /*  Async getTracksOnExplode() {
    throw Error('not supported');
    /*const view = this.currentView;
    const tagUrl = view.tagUrl;

    if (!tagUrl) {
      throw Error('Tag URL missing');
    }

    const modelParams: TagModelGetReleasesParams = {
      tagUrl,
      limit: bandcamp.getConfigValue('itemsPerPage', 47),
      filters: await this.#getReleasesFiltersFromUriAndDefault()
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    const releases = await this.getModel(ModelType.Tag).getReleases(modelParams);
    const tracks = releases.items.reduce<TrackEntity[]>((result, release) => {
      if (release.type === 'album' && release.featuredTrack?.streamUrl) {
        const track: TrackEntity = {
          type: 'track',
          name: release.featuredTrack.name,
          thumbnail: release.thumbnail,
          artist: release.artist,
          album: {
            type: 'album',
            name: release.name,
            url: release.url
          },
          position: release.featuredTrack.position,
          streamUrl: release.featuredTrack.streamUrl
        };
        result.push(track);
      }
      else if (release.type === 'track') {
        const track: TrackEntity = {
          type: 'track',
          name: release.name,
          url: release.url,
          thumbnail: release.thumbnail,
          artist: release.artist,
          streamUrl: release.streamUrl
        };
        result.push(track);
      }
      return result;
    }, []);

    return tracks;
  }*/

  /**
   * Override
   *
   * Track uri - one of:
   * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}
   * - bandcamp/track@trackUrl={...}@artistUrl={...}@albumurl={...}
   */
  /*GetTrackUri(track: TrackEntity) {
    const artistUrl = track.artist?.url || null;
    const albumUrl = track.album?.url || artistUrl;
    const trackUrl = track.url || null;

    if (track.album && albumUrl) {
      const albumView: AlbumView = {
        name: 'album',
        albumUrl
      };
      if (track.position) {
        albumView.track = track.position.toString();
      }
      if (artistUrl) {
        albumView.artistUrl = artistUrl;
      }

      return `bandcamp/${ViewHelper.constructUriSegmentFromView(albumView)}`;
    }

    if (trackUrl) {
      const trackView: TrackView = {
        name: 'track',
        trackUrl
      };
      if (artistUrl) {
        trackView.artistUrl = artistUrl;
      }
      if (albumUrl) {
        trackView.albumUrl = albumUrl;
      }
      return `bandcamp/${ViewHelper.constructUriSegmentFromView(trackView)}`;
    }

    return null;
  }*/
}
