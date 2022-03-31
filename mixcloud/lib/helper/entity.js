'use strict';

const SlugItem = require(mixcloudPluginLibRoot + '/core/entities/slug');
const Cloudcast = require(mixcloudPluginLibRoot + '/core/entities/cloudcast');
const Playlist = require(mixcloudPluginLibRoot + '/core/entities/playlist');
const User = require(mixcloudPluginLibRoot + '/core/entities/user');

class EntityHelper {

    static toSlugItem(data) {
        return new SlugItem(data.name, data.slug);
    }

    static toUser(data) {
        let loc = [];
        if (data.city) {
            loc.push(data.city);
        }
        if (data.country) {
            loc.push(data.country);
        }
        let location = loc.length > 0 ? loc.join(', ') : null;
        return new User(data.username, data.url, data.name, this.getThumbnail(data.images), data.about, location);
    }

    static toCloudcast(data) {
        let owner = data.owner ? this.toUser(data.owner) : null;
        return new Cloudcast(data.id, data.url, data.name, data.description, this.getThumbnail(data.images), owner, data.isExclusive, data.streams, data.duration);
    }

    static toPlaylist(data) {
        let owner = data.owner ? this.toUser(data.owner) : null;
        return new Playlist(data.id, data.name, data.description, data.url, owner);
    }
    
    static getImageSize() {
        return 'extra_large';
    }

    static getThumbnail(images) {
        return images[this.getImageSize()];
    }

}

module.exports = EntityHelper;