'use strict';

const { Album, Playlist, Track, User, Selection, MediaTranscoding } = require(scPluginLibRoot + '/core/entities');


class Mapper {
    static mapUser(data) {
        if (data === null) {
            return null;
        }
        let names = data.getNames();
        let location = data.getLocation();
        let locationDesc = '';
        if (location.city) {
            locationDesc = location.city;
            if (location.country) locationDesc += ', ' + location.country;
        }
        return new User(data.getId(), 
            names.username,
            names.full,
            this._getThumbnail(data),
            data.getPermalink().full,
            locationDesc);  
    }

    static mapPlaylist(data) {
        if (data === null) {
            return null;
        }

        let title = data.getTexts().title,
            description = data.getTexts().description;

        // System playlists
        if (title && title.full) title = title.full;
        if (description && description.full) description = description.full;

        return new Playlist(data.getId(),
            data.getType(),
            title,
            description,
            this._getThumbnail(data),
            data.getPermalink().full,
            Mapper.mapUser(data.getUser()),
            data.getTrackCount());
    }

    static mapTrack(data) {
        if (data === null) {
            return null;
        }

        let publisher = data.getPublisher(),
            album;
        if (!publisher) {
            album = null;
        }
        else if (publisher.getAlbumTitle()) {
            album = publisher.getAlbumTitle();
        }
        else if (publisher.getReleaseTitle()) {
            album = publisher.getReleaseTitle();
        }
        else {
            album = null;
        }

        let playableState;
        if (data.isBlocked()) {
            playableState = 'blocked';
        }
        else if (data.isSnipped()) {
            playableState = 'snipped';
        }
        else {
            playableState = 'allowed';
        }

        let transcodingInfo = data.getMediaInfo().transcodings;
        let transcodings = [];
        if (transcodingInfo) {
            transcodingInfo.forEach( (transcoding) => {
                transcodings.push({
                    url: transcoding.getUrl(),
                    protocol: transcoding.getProtocol(),
                    mimeType: transcoding.getMimeType()
                });
            });
        }

        return new Track(data.getId(),
            data.getTexts().title,
            album,
            this._getThumbnail(data),
            playableState,
            transcodings,
            Mapper.mapUser(data.getUser()));
    }

    static mapAlbum(data) {
        return this.mapPlaylist(data);
    }

    static mapSelection(data) {
        if (data === null) {
            return null;
        }
        let items = [];
        data.getItems().forEach( (item) => {
            if (item.getType() === 'playlist' || item.getType() === 'system-playlist') {
                items.push(this.mapPlaylist(item));
            }
        });
        return new Selection(data.getId(), data.getTitle(), items);
    }

    static _getThumbnail(data) {
        let artwork;
        if (data.getType() === 'user') {
            artwork = data.getAvatar();
        }
        else if (data.getType() === 'system-playlist') {
            artwork = data.getArtwork().original || data.getArtwork().calculated;
        }
        else {
            artwork = data.getArtwork();
        }
        
        if (typeof artwork === 'string') {
            return artwork;
        }

        if (artwork !== null && artwork.t500x500) {
            return artwork.t500x500;
        }

        if (artwork === null && data.getType() !== 'user' && typeof data.getUser === 'function') {
            return this._getThumbnail(data.getUser());
        }

        return null;
    }
}

module.exports = Mapper;