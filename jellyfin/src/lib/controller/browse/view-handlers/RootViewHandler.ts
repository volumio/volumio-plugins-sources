import { EntityType } from '../../../entities';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import jellyfin from '../../../JellyfinContext';
import { RenderedListItem } from './renderer/BaseRenderer';
import Server from '../../../entities/Server';
import ServerHelper from '../../../util/ServerHelper';

export interface RootView extends View {
  name: 'root';
}

export default class RootViewHandler extends BaseViewHandler<RootView> {

  async browse(): Promise<RenderedPage> {
    const renderer = this.getRenderer(EntityType.Server);
    const serverConfEntries = ServerHelper.getServersFromConfig();
    const onlineServers = jellyfin.get<Server[]>('onlineServers', []);

    const listItems = onlineServers.reduce<RenderedListItem[]>((result, server) => {
      const serverConfs = serverConfEntries.filter(
        (conf) => ServerHelper.getConnectionUrl(conf.url) === server.connectionUrl);
      serverConfs.forEach((conf) => {
        const rendered = renderer.renderToListItem({
          ...server,
          username: conf.username
        });
        if (rendered) {
          result.push(rendered);
        }
      });
      return result;
    }, []);

    return {
      navigation: {
        prev: {
          uri: '/'
        },
        lists: [
          {
            availableListViews: listItems.length > 0 ? [ 'list', 'grid' ] : [ 'list' ],
            items: listItems
          }
        ]
      }
    };
  }
}
