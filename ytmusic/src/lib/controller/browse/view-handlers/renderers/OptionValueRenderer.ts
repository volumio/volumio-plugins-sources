import { PageElement } from '../../../../types';
import { EndpointType } from '../../../../types/Endpoint';
import View from '../View';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

const ENDPOINT_TYPES = [ EndpointType.Browse,
  EndpointType.Search,
  EndpointType.BrowseContinuation,
  EndpointType.SearchContinuation ];

interface OptionValueRendererListItemOptions {
  extraUriParams: Record<string, any>;
}

export default class OptionValueRenderer extends BaseRenderer<PageElement.Option['optionValues'][0]> {

  #baseUri: string;
  #prevUri: string;

  renderToListItem(data: PageElement.Option['optionValues'][0], opts?: OptionValueRendererListItemOptions): RenderedListItem | null {
    const view = this.currentView;
    const baseUri = this.#getBaseUri();
    const prevUri = this.#getPrevUri();

    let valueUri: string;
    if (data.endpoint?.type && ENDPOINT_TYPES.includes(data.endpoint.type)) {
      let targetView: View;
      if (view.genericViewUri) {
        targetView = ViewHelper.getViewFromUriSegment(view.genericViewUri);
      }
      else {
        targetView = {
          name: 'generic'
        };
      }
      targetView.endpoint = data.endpoint;

      if (opts?.extraUriParams) {
        for (const [ key, value ] of Object.entries(opts.extraUriParams)) {
          targetView[key] = value;
        }
      }

      valueUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(targetView)}`;
    }
    else if (data.selected) {
      valueUri = prevUri;
    }
    else {
      valueUri = baseUri;
    }

    return {
      service: 'ytmusic',
      type: 'item-no-menu',
      title: data.text,
      icon: data.selected ? 'fa fa-check' : 'fa',
      uri: valueUri
    };
  }

  #getBaseUri() {
    if (!this.#baseUri) {
      const baseUriViews = [ ...this.previousViews ];
      baseUriViews.pop();
      this.#baseUri = ViewHelper.constructUriFromViews(baseUriViews) || 'ytmusic';
    }
    return this.#baseUri;
  }

  #getPrevUri() {
    if (!this.#prevUri) {
      this.#prevUri = ViewHelper.constructPrevUri(this.currentView, this.previousViews);
    }
    return this.#prevUri;
  }
}
