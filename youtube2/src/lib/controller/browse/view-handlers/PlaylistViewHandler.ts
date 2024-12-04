import { ModelType } from '../../../model';
import { type PageContent } from '../../../types/Content';
import type Endpoint from '../../../types/Endpoint';
import GenericViewHandler, { type GenericView } from './GenericViewHandler';

export interface PlaylistView extends Omit<GenericView, 'name'> {
  name: 'playlist',
  endpoints: {
    browse: Endpoint;
    watch: Endpoint;
  };
}

export default class PlaylistViewHandler extends GenericViewHandler<PlaylistView> {

  protected async getContents(): Promise<PageContent> {
    const endpoint = this.assertEndpointExists(this.getEndpoint());
    const model = this.getModel(ModelType.Playlist);
    const contents = await model.getContents(endpoint);
    return this.assertPageContents(contents);
  }

  protected getEndpoint(explode?: boolean): Endpoint | null {
    const view = this.currentView;
    if (!view.continuation) {
      const endpoints = view.endpoints;
      return (explode ? endpoints.watch : endpoints.browse) || null;
    }
    return super.getEndpoint();
  }
}
