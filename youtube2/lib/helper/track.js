'use strict';

const yt2 = require('../youtube2');
const Model = require('../model');
const Parser = require('../controller/browse/view-handlers/parser');
const ViewHelper = require('./view');

class TrackHelper {

  static validateExplodeUri(uri) {
    // Current view
    const view = ViewHelper.getViewsFromUri(uri).pop();

    if (!view) {
      return false;
    }

    switch (view.name) {
      case 'video':
        return !!view.explodeTrackData;
      
      case 'playlist':
        return !!view.endpoint || !!view.endpoints;

      case 'generic':
        return !!view.endpoint;
      
      default:
        return false;
    }
  }

  /**
   * Converts a legacy URI (pre v1.0) to one that current version can explode.
   * @param {*} uri 
   * @returns Converted URI or `null` on failure
   */
  static async convertLegacyExplodeUri(uri) {
    // Current view
    const view = ViewHelper.getViewsFromUri(uri).pop();
    
    if (!view) {
      return null;
    }

    const newView = {};

    if (view.name === 'video' && view.videoId) {
      const model = Model.getInstance('video');
      const parser = Parser.getInstance('video');
      const videoInfo = await model.getInfo(view.videoId);
      if (videoInfo) {
        videoInfo.endpoint = {
          type: 'watch',
          payload: {
            videoId: view.videoId
          }
        };
        if (view.fromPlaylistId) {
          videoInfo.endpoint.playlistId = view.fromPlaylistId;
        }

        newView.name = 'video';
        newView.explodeTrackData = encodeURIComponent(JSON.stringify(parser.getExplodeTrackData(videoInfo)));
      }
    }
    else if (view.name === 'videos' && view.playlistId) {
      newView.name = 'generic';
      newView.endpoint = encodeURIComponent(JSON.stringify({
        type: 'watch',
        payload: {
          playlistId: view.playlistId
        }
      }));
    }
    else if (view.name === 'playlists' && view.channelId) {
      newView.name = 'generic';
      newView.endpoint = encodeURIComponent(JSON.stringify({
        type: 'browse',
        payload: {
          browseId: view.channelId
        }
      }));
    }
    else {
      return null;
    }

    return ViewHelper.constructUriFromViews([{name: 'root'}, newView]);
  }

  /**
   * `track` contains the barebone data needed to build a Volumio track item, which can
   * then be added to Volumio's queue or playlist. This function converts the data into said
   * track item.
   * @param {*} track Track data (see VideoParser#getExplodeTrackData() for data structure)
   * @returns `object`
   */
  static parseToQueueItem(track) {
    return {
      'service': 'youtube2',
      'uri': this._getTrackUri(track),
      'albumart': track.albumart,
      'artist': track.artist,
      'album': yt2.getI18n('YOUTUBE2_TITLE'),
      'name': track.title,
      'title': track.title
    };
  }

  static _getTrackUri(track) {
    const parts = [
      'youtube2/video',
      `endpoint=${encodeURIComponent(JSON.stringify(track.endpoint))}`,
      // explodeTrackData - necessary because Volumio adds track uri in 
      // its own playlist / favorites / Last 100, and explodes them again when
      // played.
      `explodeTrackData=${encodeURIComponent(JSON.stringify(track))}`
    ];

    return parts.join('@');
  }
}

module.exports = TrackHelper;
