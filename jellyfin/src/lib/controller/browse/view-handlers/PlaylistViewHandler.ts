import { EntityType } from '../../../entities';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedList, RenderedPage, RenderedPageContents } from './ViewHandler';

export interface PlaylistView extends View {
  name: 'playlists';
}

export default class PlaylistViewHandler extends BaseViewHandler<PlaylistView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const lists: RenderedList[] = [];
    const modelQueryParams = this.getModelQueryParams();

    const model = this.getModel(ModelType.Playlist);
    const renderer = this.getRenderer(EntityType.Playlist);
    const playlists = await model.getPlaylists(modelQueryParams);
    const listItems = playlists.items.map((playlist) =>
      renderer.renderToListItem(playlist)).filter((item) => item) as RenderedListItem[];

    if (playlists.nextStartIndex) {
      const nextUri = this.constructNextUri(playlists.nextStartIndex);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    lists.push({
      availableListViews: listItems.length > 0 ? [ 'list', 'grid' ] : [ 'list' ],
      items: listItems
    });

    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      lists
    };

    await this.setPageTitle(pageContents);

    return {
      navigation: pageContents
    };
  }
}
