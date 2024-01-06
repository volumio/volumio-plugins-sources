import { ContentItem, PageElement } from '../../../../types';
import { GenericView } from '../GenericViewHandler';
import { PlaylistView } from '../PlaylistViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';

export default class PlaylistRenderer extends BaseRenderer<ContentItem.Playlist, PageElement.PlaylistHeader> {

  renderToListItem(data: ContentItem.Playlist): RenderedListItem | null {
    const subtitles: string[] = [];
    if (data.author?.name) {
      subtitles.push(data.author.name);
    }
    if (data.videoCount) {
      subtitles.push(data.videoCount);
    }
    const artist = subtitles.join(' • ');

    const endpoints: any = {
      watch: data.endpoint
    };

    let type: 'folder' | 'album' = 'folder';

    if (data.browseEndpoint) {
      endpoints.browse = data.browseEndpoint;
    }
    else {
      // `CompactStations` converted to playlists do not have browseEndpoints and are to be played
      // Directly when clicked, i.e. they are not browseable.
      type = 'album';
    }

    const targetView: PlaylistView = {
      name: 'playlist',
      endpoints
    };

    return {
      service: 'youtube2',
      type,
      title: data.title,
      albumart: data.thumbnail,
      artist,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }

  renderToHeader(data: PageElement.PlaylistHeader): RenderedHeader | null {
    const targetView: GenericView = {
      name: 'generic',
      endpoint: data.endpoint
    };
    return {
      service: 'youtube2',
      type: 'playlist',
      uri: `youtube2/${ViewHelper.constructUriSegmentFromView(targetView)}`,
      title: data.title,
      artist: data.author?.name,
      duration: data.subtitles?.join(' • '),
      albumart: data.thumbnail
    };
  }
}
