import { PageElement } from '../../../../types';
import { OptionSelectionView } from '../OptionSelectionViewHandler';
import { ContinuationBundle } from '../View';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

const EXCLUDE_VIEW_PARAMS = [ 'name', 'continuation', 'endpoint', 'continuationBundle' ];

const CHIP_STYLE_COMMON = 'display: inline-block; padding: 5px 12px; margin-right: 10px; border-radius: 5px;';
const CHIP_STYLE_UNSELECTED = `${CHIP_STYLE_COMMON} background: rgba(255, 255, 255, 0.15); color: #fff;`;
const CHIP_STYLE_SELECTED = `${CHIP_STYLE_COMMON} background: #fff; color: #000;`;

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

    const targetView: OptionSelectionView = {
      name: 'optionSelection',
      genericViewUri: this.#getGenericViewUri(),
      option: data
    };

    return {
      service: 'ytmusic',
      type: 'item-no-menu',
      title: this.#getDisplayText(data),
      icon: 'fa fa-angle-down',
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }

  #renderContinuationBundleOptionToListItem(data: ContinuationBundleOption): RenderedListItem | null {
    const bundle = data.continuationBundle;
    const keyParts = data.targetKey.split('.');
    const option = keyParts.reduce<any>((targetValue, key) => targetValue[key], bundle);
    if (typeof option === 'object' && option.type === 'option') {
      const targetView: OptionSelectionView = {
        name: 'optionSelection',
        fromContinuationBundle: '1',
        continuationBundle: bundle,
        targetKey: data.targetKey,
        genericViewUri: this.#getGenericViewUri()
      };

      return {
        service: 'ytmusic',
        type: 'item-no-menu',
        title: this.#getDisplayText(option),
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

  #getDisplayText(option: PageElement.Option): string {
    if (option.subtype !== 'chipCloud') {
      const selected = option.optionValues.find((ov) => ov.selected) || null;
      return selected ? selected.text : option.optionValues[0].text;
    }

    // ChipCloud - show each option value as a chip
    const displayText = option.optionValues.reduce((result, ov) => {
      if (ov.isReset) {
        return result;
      }
      const style = ov.selected ? CHIP_STYLE_SELECTED : CHIP_STYLE_UNSELECTED;
      result += `<span style='${style}'>${ov.text}</span>`;

      return result;
    }, '');

    return displayText;
  }
}
