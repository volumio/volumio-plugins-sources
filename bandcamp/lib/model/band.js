'use strict';

const libQ = require('kew');
const bcfetch = require('bandcamp-fetch');
const bandcamp = require(bandcampPluginLibRoot + '/bandcamp');
const BaseModel = require(__dirname + '/base');
const Artist = require(bandcampPluginLibRoot + '/core/entities/artist.js');
const Label = require(bandcampPluginLibRoot + '/core/entities/label.js');

class BandModel extends BaseModel {

    getBands(options) {
        if (options.labelUrl) { // Get label artists
            return this.getItems(options);
        }
        return libQ.resolve([]);
    }

    getBand(bandUrl) {
        let self = this;
        let defer = libQ.defer();

        bandcamp.getCache().cacheOrPromise(self.getCacheKeyForFetch('band', { bandUrl }), () => {
            return bcfetch.limiter.getArtistOrLabelInfo(bandUrl, {
                imageFormat: self.getArtistImageFormat()
            });
        }).then( (info) => {
            if (info.type === 'artist') {
                let artist = new Artist(info.url, info.name, info.imageUrl, info.location);
                if (info.label) {
                    artist.label = new Label(info.label.url, info.label.name);
                }
                defer.resolve(artist);
            }
            else if (info.type === 'label') {
                defer.resolve(new Label(info.url, info.name, info.imageUrl, info.location));
            }
            else {
                defer.resolve(null);
            }            
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getFetchPromise(options) {
        let self = this;
        return bandcamp.getCache().cacheOrPromise(self.getCacheKeyForFetch('artists', { labelUrl: options.labelUrl }), () => {
            return bcfetch.limiter.getLabelArtists(options.labelUrl, {
                imageFormat: self.getArtistImageFormat()
            });
        });
    }

    getItemsFromFetchResult(result, options) {
        return result.slice(0);
    }

    convertToEntity(item, options) {
        return new Artist(item.url, item.name, item.imageUrl, item.location);
    }

}

module.exports = BandModel;