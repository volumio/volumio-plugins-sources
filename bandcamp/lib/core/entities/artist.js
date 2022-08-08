'use strict';

const Band = require("./band");

class Artist extends Band {

    constructor(url, name, thumbnail, location, label = null, isLabel = false) {
        super('artist', url, name, thumbnail, location);
        this.label = label;
    }

}

module.exports = Artist;