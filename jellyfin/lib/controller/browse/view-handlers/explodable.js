'use strict';

const libQ = require('kew');
const BaseViewHandler = require(__dirname + '/base');

class ExplodableViewHandler extends BaseViewHandler {

    explode() {
        let self = this;

        let view = self.getCurrentView();
        if (view.noExplode) {
            return libQ.resolve([]);
        }

        let defer = libQ.defer();
        this.getSongsOnExplode().then( (songs) => {
            if (!Array.isArray(songs)) {
                self._parseSongForExplode(songs).then( (songInfo) => {
                    defer.resolve([songInfo]);
                });
            }
            else {
                let parsePromises = [];
                songs.forEach( (song, songIndex) => {
                    parsePromises.push(self._parseSongForExplode(song));
                });
                libQ.all(parsePromises).then( (songs) => {
                    let items = [];
                    songs.forEach( (song) => {
                        items.push(song);
                    });
                    defer.resolve(items);
                });
            }
        }).fail( (error) => {
            defer.reject(error);
        })

        return defer.promise;
    }

    getSongsOnExplode() {
        return libQ.resolve([]);
    }

    _parseSongForExplode(song) {
        let defer = libQ.defer();

        // Because we set consume update service (mpd) to ignore metadata,
        // we need to also provide the samplerate and bitdepth
        let bitdepth, samplerate;
        let stream = this._getAudioStreamMetadata(song);
        if (stream && stream.BitDepth && stream.SampleRate) {
            bitdepth = `${ stream.BitDepth } bit`;
            samplerate = `${ stream.SampleRate / 1000 } kHz`;
            // Special handling for DSDs
            if (stream.Codec && stream.Codec.startsWith('dsd_')) {
                bitdepth = '1 bit';
                switch (stream.BitDepth * stream.SampleRate) {
                    case 2822400: // DSD64
                        samplerate = '2.82 MHz';
                        break;
                    case 5644800: // DSD128
                        samplerate = '5.64 MHz';
                        break;
                    case 11289600: // DSD256
                        samplerate = '11.2 MHz';
                        break;
                    case 22579200: // DSD512
                        samplerate = '22.58 MHz';
                        break;
                    case 45158400: // DSD1024
                        samplerate = '45.2 MHz';
                        break;
                    default:
                        samplerate = `{ Math.round(stream.BitDepth * stream.SampleRate / 10000) / 100 } MHz`;
                }
            }
            else {
                bitdepth = `${ stream.BitDepth } bit`;
                samplerate = `${ stream.SampleRate / 1000 } kHz`;
            }
        }

        let data = {
            'service': 'jellyfin',
            'uri': this._getTrackUri(song),
            'type': 'song',
            'albumart': this.getAlbumArt(song),
            'artist': song.Artists.join(', '),
            'album': '',
            'name': song.Name,
            'title': song.Name,
            'bitdepth': bitdepth,
            'samplerate': samplerate
        };

        if (song.Album != undefined) {
            data.album = song.Album;
            defer.resolve(data);
        }
        else if (song.AlbumId != undefined) {
            // Some songs don't have Album names, e.g. WAV files. 
            // If AlbumId is available, then obtain the name from album
            let albumModel = this.getModel('album');
            albumModel.getAlbum(song.AlbumId).then( (album) => {
                data.album = album.Name;
                defer.resolve(data);
            }).fail( (error) => {
                defer.resolve(data);
            })
        }
        else {
            defer.resolve(data);
        }

        return defer.promise;
    }

    _getAudioStreamMetadata(song) {
        if (Array.isArray(song.MediaSources)) {
            let source = song.MediaSources[0];
            if (source && Array.isArray(source.MediaStreams)) {
                return source.MediaStreams.find(ms => ms.Type === 'Audio') || null;
            }
        }
        return null;
    }

    /**
     * Track uri:
     * jellyfin/{serverId}/song@songId={songId}
     */
    _getTrackUri(song) {
        return 'jellyfin/' + this.getCurrentView().serverId + '/song@songId=' + song.Id;
    }

}

module.exports = ExplodableViewHandler;