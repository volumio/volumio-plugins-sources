'use strict';

const libQ = require('kew');
const RootViewHandler = require(__dirname + '/root');
const ChannelViewHandler = require(__dirname + '/channel');
const PlaylistViewHandler = require(__dirname + '/playlist');
const VideoViewHandler = require(__dirname + '/video');

class ViewHandlerFactory {

    static getHandler(uri) {
        let views = this._getViewsFromUri(uri);
        let curView = views.pop();
        let prevViews = views;

        let handler = new this._viewToClass[curView.name](curView, prevViews);

        return libQ.resolve(handler);
    }

    static _getViewsFromUri(uri) {
        let result = [];

        let segments = uri.split('/');
        if (segments.length && segments[0] !== 'youtube2') {
            return result;
        }

        let splitSegment = (s) => {
            let result = {};
            let ss = s.split('@');
            ss.forEach( (sss) => {
                let equalPos = sss.indexOf('=');
                if (equalPos < 0) {
                    result.name = sss;
                }
                else {
                    let key = sss.substr(0, equalPos);
                    let value = sss.substr(equalPos + 1);
                    
                    result[key] = value;
                }
            });
            return result;
        };

        segments.forEach( (segment, index) => {
            let data;
            if (index === 0) { // 'youtube2/...'
                data = {
                    name: 'root'
                };
            }
            else {
                data = splitSegment(segment);
            }
            result.push(data);
        });

        return result;
    }
}

ViewHandlerFactory._viewToClass = {
    'root': RootViewHandler,
    'channels': ChannelViewHandler,
    'playlists': PlaylistViewHandler,
    'videos': VideoViewHandler,
    'video': VideoViewHandler,

}

module.exports = ViewHandlerFactory;