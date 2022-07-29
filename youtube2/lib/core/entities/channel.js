'use strict';

const BaseEntity = require(__dirname + '/base');

class Channel extends BaseEntity {

    constructor(id, title, thumbnail, description) {
        super(id, title, thumbnail);
        this.description = description;
    }

}

module.exports = Channel;