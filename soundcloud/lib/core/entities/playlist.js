'use strict';

class Playlist {

    constructor(id, type, title, description, thumbnail, permalink, user, trackCount) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.thumbnail = thumbnail;
        this.permalink = permalink;
        this.user = user;
        this.trackCount = trackCount;
    }

}

module.exports = Playlist;