const Genius = require('genius-fetch');
const md5 = require('md5');
const np = require(nowPlayingPluginLibRoot + '/np');
const Cache = require(nowPlayingPluginLibRoot + '/cache');

const fetchPromises = {
    'song': {},
    'album': {},
    'artist': {}
};

const genius = new Genius();
const metadataCache = new Cache(
    { song: 3600, album: 3600, artist: 3600 }, 
    { song: 200, album: 200, artist: 200 });

let currentAccessToken = null;

function clearCache() {
    genius.clearCache();
    metadataCache.clear();
}

function setAccessToken(accessToken) {
    if (accessToken === currentAccessToken) {
        return;
    }
    genius.config({accessToken});
    clearCache();
    currentAccessToken = accessToken;
}

function getFetchPromise(type, params, callback) {
    const key = md5(JSON.stringify(params));
    if (fetchPromises[type][key]) {
        return fetchPromises[type][key];
    }
    else {
        const promise = callback();
        fetchPromises[type][key] = promise;
        promise.finally(() => { 
            delete fetchPromises[type][key]; 
        });
        return promise;
    }
}

function getSongSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        title: info.title.regular,
        description: info.description || null,
        image: info.image,
        embed: info.embed
    };
}

function getAlbumSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        title: info.title.regular,
        description: info.description || null,
        releaseDate: info.releaseDate ? info.releaseDate.text : null,
        image: info.image
    };
}

function getArtistSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        name: info.name,
        description: info.description || null,
        image: info.image
    };
}

async function _getSongByNameOrBestMatch(params) {
    if (!params.name) {
        return null;
    }

    if (params.artist) {
        return genius.getSongByBestMatch(params, {textFormat: 'plain', obtainFullInfo: true});
    }
    else {
        const song = await genius.getSongsByName(params.name, {textFormat: 'plain', obtainFullInfo: true, limit: 1});
        return song.items[0] || null;
    }
}

/**
 * params {
 *  name: ...
 *  artist: ...
 *  album: ...
 * }
 */
function getSongInfo(params) {
    return getFetchPromise('song', params, async () => {
        const result = {
            song: null,
            artist: null,
            album: null
        };

        // Do not include album, as compilation albums tend to result in false hits
        const matchParams = {
            name: params.name,
            artist: params.artist
        };
        const song = await _getSongByNameOrBestMatch(matchParams);
        if (song) {
            result.song = getSongSnippet(song);
            if (song.artists && song.artists.primary) {
                const artist = await genius.getArtistById(song.artists.primary.id, {textFormat: 'plain'});
                result.artist = getArtistSnippet(artist);
            }

            if (result.song.embed) {
                result.song.embedContents = await genius.parseSongEmbed(song.embed);
            }
        }
        // No song found, but still attempt to fetch artist info
        else if (params.artist) {
            const artistInfo = await getArtistInfo({name: params.artist});
            if (artistInfo.artist) {
                result.artist = artistInfo.artist;
            }
        }

        // Finally, fetch album info
        const albumInfo = await getAlbumInfo({
            name: params.album, 
            artist: params.artist
        });
        if (albumInfo) {
            result.album = albumInfo.album;
        }

        return result;
    });
}

async function _getAlbumByNameOrBestMatch(params) {
    if (!params.name) {
        return null;
    }

    if (params.artist) {
        return genius.getAlbumByBestMatch(params, {textFormat: 'plain', obtainFullInfo: true});
    }
    else {
        const album = await genius.getAlbumsByName(params.name, {textFormat: 'plain', obtainFullInfo: true, limit: 1});
        return album.items[0] || null;
    }
}

/**
 * params {
 *  name: ...
 *  artist: ...
 * }
 */
function getAlbumInfo(params) {
    return getFetchPromise('album', params, async () => {
        const result = {
            album: null,
            artist: null
        }
        const album = await _getAlbumByNameOrBestMatch(params);
        result.album = getAlbumSnippet(album);
        if (album && album.artist) {
            const artist = await genius.getArtistById(album.artist.id, {textFormat: 'plain'});
            result.artist = getArtistSnippet(artist);
        }
        return result;
    });
}

/**
 * params {
 *  name: ...
 * }
 */
function getArtistInfo(params) {
    return getFetchPromise('artist', params, async () => {
        const result = {
            artist: null
        }
        if (!params.name) {
            return result;
        }
        const artist = await genius.getArtistsByName(params.name, {textFormat: 'plain', obtainFullInfo: true, limit: 1});
        result.artist = getArtistSnippet(artist.items[0]);
        return result;
    });
}

async function fetchInfo(params) {
    if (!np.getConfigValue('geniusAccessToken')) {
        return Promise.reject(np.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
    }
    try {
        let info = {};
        const cacheKey = md5(JSON.stringify(params));
        if (params.type === 'song') {
            info = await metadataCache.getOrSet('song', cacheKey, () => getSongInfo(params));
        }
        else if (params.type === 'album') {
            info = await metadataCache.getOrSet('album', cacheKey, () => getAlbumInfo(params));
        }
        else if (params.type === 'artist') {
            info = await metadataCache.getOrSet('artist', cacheKey, () => getArtistInfo(params));
        }
        return Promise.resolve(info);
    } catch (e) {
        const {message, statusCode, statusMessage} = e;
        const status = (statusCode && statusMessage) ? `${statusCode} - ${statusMessage}` : (statusCode || statusMessage);
        let msg;
        if (status) {
            msg = `${np.getI18n('NOW_PLAYING_ERR_METADATA_FETCH')}: ${status}`;
        }
        else {
            msg = np.getI18n('NOW_PLAYING_ERR_METADATA_FETCH') + (message ? `: ${message}` : '');
        }
        return Promise.reject(msg);
    }
}

module.exports = {
    setAccessToken,
    fetchInfo,
    clearCache
};
