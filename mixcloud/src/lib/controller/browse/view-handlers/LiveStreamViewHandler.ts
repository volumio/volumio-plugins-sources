import mixcloud from '../../../MixcloudContext';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { ModelType } from '../../../model';
import { RenderedListItem } from './renderers/BaseRenderer';
import ExplodableViewHandler from './ExplodableViewHandler';
import { RendererType } from './renderers';
import { LoopFetchResult } from '../../../model/BaseModel';
import { LiveStreamModelGetLiveStreamsParams, LiveStreamOrderBy } from '../../../model/LiveStreamModel';
import { LiveStreamEntity } from '../../../entities/LiveStreamEntity';
import UIHelper from '../../../util/UIHelper';

export interface LiveStreamView extends View {
  name: 'liveStream' | 'liveStreams';

  // For browse current live streams
  category?: string;
  orderBy?: LiveStreamOrderBy;
  select?: 'category' | 'orderBy';

  // For explode
  username?: string;
}

export default class LiveStreamViewHandler extends ExplodableViewHandler<LiveStreamView> {

  browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.select) {
      return this.#browseLiveStreamOptions(view.select);
    }
    return this.#browseLiveStreams();
  }

  async #browseLiveStreams() {
    const view = this.currentView;
    const liveStreamParams: LiveStreamModelGetLiveStreamsParams = {
      category: view.category || '',
      limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection') : mixcloud.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
      liveStreamParams.pageToken = view.pageRef.pageToken;
      liveStreamParams.pageOffset = view.pageRef.pageOffset;
    }
    if (view.orderBy) {
      liveStreamParams.orderBy = view.orderBy;
    }

    const liveStreamModel = this.getModel(ModelType.LiveStream);
    const liveStreams = await liveStreamModel.getLiveStreams(liveStreamParams);

    const lists: RenderedList[] = [];

    if (liveStreams.items.length > 0) {
      const optionList = await this.getOptionList({
        getOptionBundle: async () => liveStreamModel.getLiveStreamsOptions(),
        currentSelected: liveStreams.params
      });

      if (optionList) {
        lists.push(optionList);
      }

      lists.push(this.#getLiveStreamList(liveStreams));

      lists[0].title = UIHelper.addMixcloudIconToListTitle(mixcloud.getI18n('MIXCLOUD_LIVE_STREAMING_NOW'));
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #getLiveStreamList(liveStreams: LoopFetchResult<LiveStreamEntity>): RenderedList {
    const renderer = this.getRenderer(RendererType.LiveStream);
    const items = liveStreams.items.reduce<RenderedListItem[]>((result, liveStream) => {
      const rendered = renderer.renderToListItem({
        ...liveStream
      });
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    const nextPageRef = this.constructPageRef(liveStreams.nextPageToken, liveStreams.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      items.push(this.constructNextPageItem(nextUri));
    }

    return {
      availableListViews: [ 'list', 'grid' ],
      items
    };
  }

  #browseLiveStreamOptions(option: string) {
    return this.browseOptionValues({
      getOptionBundle: async () => this.getModel(ModelType.LiveStream).getLiveStreamsOptions(),
      targetOption: option
    });
  }

  protected async getStreamableEntitiesOnExplode() {
    const view = this.currentView;
    if (!view.username) {
      throw Error('Operation not supported');
    }
    const liveStream = await this.getModel(ModelType.LiveStream).getLiveStream(view.username);
    if (!liveStream) {
      return [];
    }
    return liveStream;
  }
}
