'use strict';

class AutoplayHelper {

  // Every playable item is associated with a playlist, which is actually the 'queue' in
  // ytmusic (not to be confused with Volumio's queue). The autoplay context tells 
  // the plugin where to obtain further tracks for autoplay. See PlayController#_getAutoplayItems().
  static getAutoplayContext(data, previous) {
    if (!data) {
      return null;
    }

    if (data.type === 'section') {
      if (data.isWatch) {
        const context = {};
        if (data.continuation) {
          context.playlistId = data.playlistId;
          context.params = data.playlistParams;
          context.continuation = data.continuation;
        }
        else if (data.automix && data.automix.endpoint?.payload?.playlistId) {
          context.playlistId = data.automix.endpoint.payload.playlistId;
          context.params = data.automix.endpoint.payload.params;
        }
        if (!context.params) {
          delete context.params;
        }
        return context;
      }

      const context = data.playlistId && data.playlistParams ? {
        playlistId: data.playlistId,
        params: data.playlistParams
      } : this._getCommonPlaylistDataFromEndpoints(data.contents);
      if (context?.playlistId) {
        const items = data.contents?.filter((item) => item.type === 'song' || item.type === 'video') || [];
        if (items.length > 0) {
          context.continueFromVideoId = items[items.length - 1].id;
          if (!context.params && context.playlistId === previous?.playlistId) {
            context.params = previous?.params;
          }
          if (!context.params) {
            delete context.params;
          }
          return context;
        }
      }
      return null;
    }
    else if ((data.type === 'song' || data.type === 'video')) {
      const context = {
        continueFromVideoId: data.id
      };
      // `endpoint` refers to watch endpoint 
      if (data.endpoint?.payload?.playlistId) {
        context.playlistId = data.endpoint.payload.playlistId;
      }
      if (data.endpoint?.payload?.params) {
        context.params = data.endpoint.payload.params;
      }
      return context;
    }
    
    return null;
  }

  static _getCommonPlaylistDataFromEndpoints(contents) {
    const hasOnlySongsAndVideos = contents?.length > 0 && 
      contents?.every((item)=> item.type === 'song' || item.type === 'video');
    if (hasOnlySongsAndVideos) {
      const playlistId = contents[0].endpoint?.payload?.playlistId;
      const params = contents[0].endpoint?.payload?.params;
      return contents.every(
        (item) => item.endpoint?.payload?.playlistId === playlistId && item.endpoint?.payload?.params === params) ? { playlistId, params } : null;
    }
    return null;
  }
}

module.exports = AutoplayHelper
