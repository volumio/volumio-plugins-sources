import { PageElement } from '../../../../types';
import { OptionSelectionView } from '../OptionSelectionViewHandler';
import { ContinuationBundle } from '../View';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

const EXCLUDE_VIEW_PARAMS = [ 'name', 'continuation', 'endpoint', 'continuationBundle' ];

export interface ContinuationBundleOption {
  type: 'continuationBundleOption';
  continuationBundle: ContinuationBundle;
  targetKey: string;
}

export default class OptionRenderer extends BaseRenderer<PageElement.Option | ContinuationBundleOption> {

  renderToListItem(data: PageElement.Option | ContinuationBundleOption): RenderedListItem | null {
    if (data.type === 'continuationBundleOption') {
      return this.#renderContinuationBundleOptionToListItem(data as ContinuationBundleOption);
    }

    const optionData = data as PageElement.Option;
    const selected = optionData.optionValues.find((ov) => ov.selected) || optionData.optionValues[0];

    const targetView: OptionSelectionView = {
      name: 'optionSelection',
      genericViewUri: this.#getGenericViewUri(),
      option: data
    };

    return {
      service: 'youtube2',
      type: 'item-no-menu',
      title: selected.text,
      icon: 'fa fa-angle-down',
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }

  #renderContinuationBundleOptionToListItem(data: ContinuationBundleOption): RenderedListItem | null {
    const bundle = data.continuationBundle;
    const keyParts = data.targetKey.split('.');
    const option = keyParts.reduce<any>((targetValue, key) => targetValue[key], bundle);
    if (typeof option === 'object' && option.type === 'option') {
      const selected = (option as PageElement.Option).optionValues.find((ov) => ov.selected) || null;
      const displayText = selected ? (option.title ? `${option.title}: ${selected.text}` : selected.text) : (option.title || option.optionValues[0].text);

      const targetView: OptionSelectionView = {
        name: 'optionSelection',
        fromContinuationBundle: '1',
        continuationBundle: bundle,
        targetKey: data.targetKey,
        genericViewUri: this.#getGenericViewUri()
      };

      return {
        service: 'youtube2',
        type: 'item-no-menu',
        title: displayText,
        icon: 'fa fa-angle-down',
        uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`
      };
    }

    return null;
  }

  #getGenericViewUri() {
    const view = this.currentView;
    const genericViewParams = Object.keys(view).reduce<Record<string, any>>((result, key) => {
      if (!EXCLUDE_VIEW_PARAMS.includes(key)) {
        result[key] = view[key];
      }
      return result;
    }, {});
    const genericView = {
      name: view.name,
      ...genericViewParams
    };
    return ViewHelper.constructUriSegmentFromView(genericView);
  }
}
