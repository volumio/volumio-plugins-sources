"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntityConverter {
    static convertCloudcast(data) {
        return {
            type: 'cloudcast',
            id: data.id,
            url: data.url,
            name: data.name,
            description: data.description,
            thumbnail: data.images?.extra_large,
            owner: data.owner ? this.convertUser(data.owner) : undefined,
            isExclusive: data.isExclusive,
            streams: data.streams,
            duration: data.duration
        };
    }
    static convertUser(data) {
        const locationParts = [];
        if (data.city) {
            locationParts.push(data.city);
        }
        if (data.country) {
            locationParts.push(data.country);
        }
        const location = locationParts.join(', ');
        return {
            type: 'user',
            username: data.username,
            url: data.url,
            name: data.name,
            thumbnail: data.images?.extra_large,
            about: data.about,
            location: location || undefined
        };
    }
    static convertPlaylist(data) {
        return {
            type: 'playlist',
            id: data.id,
            name: data.name,
            description: data.description,
            url: data.url,
            owner: data.owner ? this.convertUser(data.owner) : undefined
        };
    }
    static convertSlugLike(data) {
        return {
            type: 'slug',
            name: data.name,
            slug: data.slug
        };
    }
    static convertLiveStream(data) {
        return {
            type: 'liveStream',
            id: data.id,
            name: data.name,
            description: data.description,
            status: data.status,
            isLive: data.status === 'LIVE',
            owner: data.owner ? this.convertUser(data.owner) : undefined,
            thumbnail: data.images?.extra_large,
            streams: data.streams
        };
    }
}
exports.default = EntityConverter;
//# sourceMappingURL=EntityConverter.js.map