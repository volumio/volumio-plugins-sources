'use strict';

class Track {

    constructor(id, title, album, thumbnail, playableState, transcodings, user) {
        this.id = id;
        this.title = title;
        this.album = album;
        this.thumbnail = thumbnail;
        this.playableState = playableState;
        this.transcodings = transcodings;
        this.user = user;
    }

}

module.exports = Track;