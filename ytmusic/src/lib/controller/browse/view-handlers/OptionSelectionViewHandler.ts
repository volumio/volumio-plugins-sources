import ytmusic from '../../../YTMusicContext';
import { PageElement } from '../../../types';
import { EndpointType } from '../../../types/Endpoint';
import EndpointHelper from '../../../util/EndpointHelper';
import BaseViewHandler from './BaseViewHandler';
import View, { ContinuationBundle } from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface OptionSelectionView extends View {
  name: 'optionSelection',
  fromContinuationBundle?: '1';
  continuationBundle?: ContinuationBundle;
  targetKey?: string;
  option?: PageElement.Option;
  genericViewUri?: string;
}

export default class OptionSelectionViewHandler extends BaseViewHandler<OptionSelectionView> {

  async browse(): Promise<RenderedPage> {
    const listData = this.#getListData();
    const lists: RenderedList[] = [
      {
        title: listData.title,
        availableListViews: [ 'list' ],
        items: listData.items
      }
    ];

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }};
  }

  #getListData() {

    const view = this.currentView;
    const renderer = this.getRenderer(RendererType.OptionValue);

    let option, listItems: RenderedListItem[] = [];

    if (view.fromContinuationBundle && view.continuationBundle && view.targetKey) {

      const bundle = view.continuationBundle;
      // Deep copy
      const workBundle = JSON.parse(JSON.stringify(bundle));
      const keyParts = view.targetKey.split('.');

      const __setSelected = (option: PageElement.Option, index: number) => {
        option.optionValues.forEach((ov, i) => {
          option.optionValues[i].selected = (i === index);
        });
      };

      const __getTargetOption = (_bundle: ContinuationBundle): PageElement.Option | null => {
        const target = keyParts.reduce<any>((targetValue, key) => targetValue[key], _bundle);
        if (typeof target === 'object' && target.type === 'option') {
          return target as PageElement.Option;
        }
        return null;
      };

      option = __getTargetOption(bundle);
      if (option) {
        listItems = option.optionValues.reduce<RenderedListItem[]>((result, data, index) => {
          let extraUriParams: any;
          if (EndpointHelper.isType(data.endpoint, EndpointType.BrowseContinuation, EndpointType.SearchContinuation)) {
            const workOption = __getTargetOption(workBundle);
            __setSelected(workOption as PageElement.Option, index);
            extraUriParams = {
              continuationBundle: workBundle
            };
          }
          const listItem = renderer.renderToListItem(data, { extraUriParams });
          if (listItem) {
            result.push(listItem);
          }
          return result;
        }, []);
      }
    }
    else if (view.option) {
      option = view.option as PageElement.Option;
      listItems = option.optionValues.reduce<RenderedListItem[]>((result, data) => {
        const listItem = renderer.renderToListItem(data);
        if (listItem) {
          result.push(listItem);
        }
        return result;
      }, []);
    }

    let title = option?.title;
    if (!title && option && option.subtype === 'chipCloud') {
      title = ytmusic.getI18n('YTMUSIC_OPTION_SELECT_CHIP_CLOUD_TITLE');
    }

    return {
      title,
      items: listItems
    };

  }
}
