import { ContentItem } from '../../../../types';
import { EndpointType } from '../../../../types/Endpoint';
import EndpointHelper from '../../../../util/EndpointHelper';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

const ICON_BY_BROWSE_ID: Record<string, string> = {
  'FEmusic_moods_and_genres_category': 'fa fa-music',
  'FEmusic_new_releases': 'fa fa-certificate',
  'FEmusic_charts': 'fa fa-line-chart',
  'FEmusic_moods_and_genres': 'fa fa-smile-o'
};

const ICON_BY_NAME: Record<string, string> = {
  'YTMUSIC_DID_YOU_MEAN': 'fa fa-question-circle-o', // Our own icon type
  'YTMUSIC_SHOWING_RESULTS_FOR': 'fa fa-info-circle' // Our own icon type
};

const VIEW_NAME_BY_BROWSE_ID: Record<string, string> = {
  'FEsubscriptions': 'subscriptions'
};

export default class EndpointLinkRenderer extends BaseRenderer<ContentItem.EndpointLink> {

  renderToListItem(data: ContentItem.EndpointLink): RenderedListItem | null {
    if (!EndpointHelper.validate(data.endpoint)) {
      return null;
    }

    let targetViewName;
    switch (data.endpoint.type) {
      case EndpointType.Search:
        targetViewName = 'search';
        break;
      case EndpointType.Browse:
        targetViewName = VIEW_NAME_BY_BROWSE_ID[data.endpoint.payload.browseId] || 'generic';
        break;
      default:
        targetViewName = 'generic';
    }

    const targetView = {
      name: targetViewName,
      endpoint: data.endpoint
    };
    const uri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`;

    const result: RenderedListItem = {
      service: 'ytmusic',
      // Setting type to 'album' is important for 'watch' endpoint items, as we
      // Only want this item to be exploded and not others in the same list when
      // It is clicked.
      type: EndpointHelper.isType(data.endpoint, EndpointType.Watch) ? 'album' : 'item-no-menu',
      title: data.title,
      uri
    };

    if (data.subtitle) {
      result.artist = data.subtitle;
    }

    if (data.thumbnail) {
      result.albumart = data.thumbnail;
    }
    else {
      result.icon = this.#getIcon(data) || undefined;
    }

    return result;
  }

  #getIcon(data: ContentItem.EndpointLink) {
    const iconByName = data.icon ? ICON_BY_NAME[data.icon] : null;
    if (iconByName) {
      return iconByName;
    }

    const endpoint = data.endpoint;
    if (EndpointHelper.isType(endpoint, EndpointType.Browse)) {
      return ICON_BY_BROWSE_ID[endpoint.payload.browseId] || 'fa fa-arrow-circle-right';
    }
    else if (EndpointHelper.isType(endpoint, EndpointType.Watch)) {
      return 'fa fa-play-circle';
    }

    return null;
  }
}
