'use strict';

const Band = require("./band");

class Label extends Band {

    constructor(url, name, thumbnail, location) {
        super('label', url, name, thumbnail, location);
    }

}

module.exports = Label;