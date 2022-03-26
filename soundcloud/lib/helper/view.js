'use strict';

const fs = require('fs');

class ViewHelper {
    static getViewsFromUri(uri) {
        let result = [];

        let segments = uri.split('/');
        if (segments.length && segments[0] !== 'soundcloud') {
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
            if (index === 0) { // 'soundcloud/...'
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

    static supportsEnhancedTitles() {
        return !this.isManifestUI();
    }
    
    static isManifestUI() {
        let volumioManifestUIFlagFile = '/data/manifestUI';
        let volumioManifestUIDisabledFile = '/data/disableManifestUI';
        return fs.existsSync(volumioManifestUIFlagFile) && !fs.existsSync(volumioManifestUIDisabledFile);
    }
}

module.exports = ViewHelper;