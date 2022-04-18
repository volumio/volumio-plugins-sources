'use strict';

const BaseEntity = require(__dirname + '/base');

class Video extends BaseEntity {

    constructor(id, title, thumbnail, channel, duration) {
        super(id, title, thumbnail);
        this.channel = channel;
        this.duration = duration;
    }

}

module.exports = Video;