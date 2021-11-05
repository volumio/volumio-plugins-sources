'use strict';

class Cloudcast {

    constructor(id, url, name, description, thumbnail, owner, isExclusive, streams, duration) {
        this.id = id;
        this.url = url;
        this.name = name;
        this.description = description;
        this.thumbnail = thumbnail;
        this.owner = owner;
        this.isExclusive = isExclusive;
        this.streams = streams;
        this.duration = duration;
    }
}

module.exports = Cloudcast;