'use strict';

class Playlist {

    constructor(id, name, description, url, owner) {
        this.id = id;
        this.name = name;
        this.description = description,
        this.url = url;
        this.owner = owner;
    }
}

module.exports = Playlist;