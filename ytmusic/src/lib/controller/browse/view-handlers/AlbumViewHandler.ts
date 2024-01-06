import ytmusic from '../../../YTMusicContext';
import { ModelType } from '../../../model';
import { ContentItem, PageElement } from '../../../types';
import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import { Channel, EndpointLink, Album, Playlist, MusicItem } from '../../../types/ContentItem';
import { BrowseContinuationEndpoint, BrowseEndpoint, EndpointType, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import { Option } from '../../../types/PageElement';
import MusicFolderViewHandler, { MusicFolderView } from './MusicFolderViewHandler';
import { RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
import { ContinuationBundleOption } from './renderers/OptionRenderer';

export interface AlbumView extends MusicFolderView {
  name: 'album'
}

export default class AlbumViewHandler extends MusicFolderViewHandler<AlbumView> {

  #albumArtist: ContentItem.Channel | undefined;

  async browse(): Promise<RenderedPage> {
    const page = await super.browse();
    const { channelId, name: artistName } = this.#albumArtist || {};
    if (channelId && artistName && page.navigation?.lists) {
      const lastView = this.previousViews[this.previousViews.length - 1];
      const isComingFromSameArtistView = (lastView?.endpoint?.payload?.browseId === channelId);
      if (!isComingFromSameArtistView) {
        const endpointLink: ContentItem.EndpointLink = {
          type: 'endpointLink',
          title: ytmusic.getI18n('YTMUSIC_MORE_FROM', artistName),
          endpoint: {
            type: EndpointType.Browse,
            payload: {
              browseId: channelId
            }
          }
        };
        const rendered = this.getRenderer(RendererType.EndpointLink).renderToListItem(endpointLink);
        if (rendered) {
          page.navigation.lists.unshift({
            availableListViews: [ 'list' ],
            items: [ rendered ]
          });
        }
      }
    }
    return page;
  }

  protected async modelGetContents(endpoint: WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint |
    BrowseContinuationEndpoint): Promise<PageContent | WatchContent | WatchContinuationContent | null> {
    const model = this.getModel(ModelType.Endpoint);
    const contents = await model.getContents(endpoint);
    if (contents?.type === 'page' && contents.header?.type === 'album') {
      this.#albumArtist = (contents.header as PageElement.AlbumHeader).artist;
    }
    return contents;
  }

  protected renderToListItem(data: Playlist | MusicItem | Channel | EndpointLink | Album | Option | ContinuationBundleOption, contents: PageContent): RenderedListItem | null {
    if (data.type === 'song' || data.type === 'video') {
      // Data possibly lacks album / artist / thumbnail info. Complete it by taking missing info from `contents.header`.
      if (contents.header?.type === 'album') {
        const albumHeader = contents.header as PageElement.AlbumHeader;
        const albumId = albumHeader.endpoint?.payload.playlistId;
        const dataAlbumId = data.endpoint.payload.playlistId;
        if (albumId === dataAlbumId) {
          const filledData = { ...data };
          if (!filledData.album) {
            filledData.album = {
              title: albumHeader.title
            };
          }
          if (!filledData.artists && albumHeader.artist) {
            filledData.artists = [ albumHeader.artist ];
            filledData.artistText = albumHeader.artist.name;
          }
          if (!filledData.thumbnail) {
            filledData.thumbnail = albumHeader.thumbnail;
          }
          const rendered = this.getRenderer(RendererType.MusicItem).renderToListItem(filledData);
          if (rendered) {
            // Show track number only
            rendered.albumart = null;
          }
          return rendered;
        }
      }
    }
    return super.renderToListItem(data, contents);
  }
}
