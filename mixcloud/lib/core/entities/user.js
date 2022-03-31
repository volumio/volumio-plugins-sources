'use strict';

class User {

    constructor(username, url, name, thumbnail, about, location) {
        this.username = username;
        this.url = url;
        this.name = name;
        this.thumbnail = thumbnail;
        this.about = about;
        this.location = location;
    }
}

module.exports = User;