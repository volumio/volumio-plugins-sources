'use strict';

const yt2 = require('../../../youtube2');
const Auth = require('../../../utils/auth');
const FeedViewHandler = require('./feed');

// From InnerTube lib (YouTube.js#Actions)
const REQUIRES_SIGNIN_BROWSE_IDS = [
  'FElibrary',
  'FEhistory',
  'FEsubscriptions',
  'FEchannels',
  'FEmusic_listening_review',
  'FEmusic_library_landing',
  'SPaccount_overview',
  'SPaccount_notifications',
  'SPaccount_privacy',
  'SPtime_watched'
];

/**
 * Generic view handler. Contents fetched from endpoint with the EndpointModel.
 */

class GenericViewHandler extends FeedViewHandler {

  async browse() {
    const endpoint = this.getEndpoint();
    if (!endpoint) {
      yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_ENDPOINT_INVALID'));
      throw Error(yt2.getI18n('YOUTUBE2_ERR_ENDPOINT_INVALID'));
    }

    if (endpoint.type === 'browse' && 
      REQUIRES_SIGNIN_BROWSE_IDS.includes(endpoint.payload.browseId) &&
      Auth.getAuthStatus().status !== Auth.SIGNED_IN) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_REQUIRE_SIGN_IN'));
        throw Error(yt2.getI18n('YOUTUBE2_ERR_REQUIRE_SIGN_IN'));
    }

    return super.browse();
  }

  async getContents() {
    const endpoint = this.getEndpoint();
    const model = this.getModel('endpoint');
    return model.getContents(endpoint);
  }

  async getTracksOnExplode() {
    const endpoint = this.getEndpoint(true);

    if (!endpoint || !endpoint.payload) {
      yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_OP_NOT_SUPPORTED'));
      throw Error(yt2.getI18n('YOUTUBE2_ERR_OP_NOT_SUPPORTED'));
    }

    const endpointPredicate = (endpoint) => endpoint.type === 'watch' && endpoint.payload?.playlistId;
    const model = this.getModel('endpoint');
    let targetWatchEndpoint = null;

    if (endpoint.type === 'browse') {
      let contents = await model.getContents(endpoint);
      let tabs = contents?.tabs || [];
      if (tabs.length > 0) {
        // Remaining tabs that can be used to look for watch endpoints
        tabs = tabs.filter((tab) => !tab.selected && tab.endpoint?.type === 'browse');
      }
      while (!targetWatchEndpoint) {
        targetWatchEndpoint = this.findAllEndpointsInSection(contents?.sections, endpointPredicate)[0];
        if (!targetWatchEndpoint) {
          const nextTab = tabs.shift();
          if (nextTab) {
            contents = await model.getContents(nextTab.endpoint);
          }
          else {
            break;
          }
        }
      }
    }
    else if (endpointPredicate(endpoint)) {
      targetWatchEndpoint = endpoint;
    }

    if (!targetWatchEndpoint) {
      yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_NO_PLAYABLE_ITEMS_FOUND'));
      throw Error(yt2.getI18n('YOUTUBE2_ERR_NO_PLAYABLE_ITEMS_FOUND'));
    }

    const parser = this.getParser('video');
    const contents = await model.getContents(targetWatchEndpoint);

    const result = contents?.playlist?.items?.filter((item) => item.type === 'video')
      .map((item) => parser.getExplodeTrackData(item)) || [];

    return result;
  }

  getEndpoint(explode = false) {
    const view = this.getCurrentView();
    try {
      if (view.continuation) {
        const continuation = JSON.parse(decodeURIComponent(view.continuation));
        return continuation.endpoint;
      }
      return view.endpoint ? JSON.parse(decodeURIComponent(view.endpoint)) : null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = GenericViewHandler;
