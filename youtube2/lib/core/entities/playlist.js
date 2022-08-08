'use strict';

const BaseEntity = require(__dirname + '/base');

class Playlist extends BaseEntity {

    constructor(id, title, thumbnail, channel) {
        super(id, title, thumbnail);
        this.channel = channel;
    }

}

module.exports = Playlist;