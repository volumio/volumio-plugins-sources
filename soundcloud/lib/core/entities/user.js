'use strict';

class User {

    constructor(id, username, fullname, thumbnail, permalink, location) {
        this.id = id;
        this.username = username;
        this.fullname = fullname;
        this.thumbnail = thumbnail;
        this.permalink = permalink;
        this.location = location;
    }

}

module.exports = User;