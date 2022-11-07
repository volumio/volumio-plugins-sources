'use strict';

const uuid = require("uuid")
var libQ = require('kew');
var cachemanager = require('cache-manager');
var PlexAPI = require('plex-api');
var PlexWebsocket = require("plex-websocket");

module.exports = plex;

/**
 * Initially based on Volusonic's backend as I think having a good cache is key to the experience !!
 * @param log
 * @param config
 * @returns
 * @constructor
 */
function plex(log, config) {
    var logger = log;
    var client = null;

    var isConnected = function() {
        return (client != null);
    }

    var queryLibraries = function(serverName, serverToUse, port) {
        var defer = libQ.defer();
        var token = config.get('token');
        if (token) {
             var plexServer = new PlexAPI({
                "token": token,
                "hostname": serverToUse,
                "port": port
            });
            plexServer.find({uri:"/library/sections/"}, {type: "artist"})  // A Plex Music "Library" is organised by Artist (currently)
                .then(function(result) {
                    defer.resolve({
                        "name": serverName,
                        "hostname": serverToUse,
                        "port": port,
                        "libraries": result
                    });
                });
        } else {
            defer.fail("No token");
        }
        return defer.promise;
    }

    var connect = function() {
        var defer = libQ.defer();

        var token = config.get('token');
        var serverToUse =  config.get('server');    // We need a server configured for node's plex-api library
        var port = config.get('port') | 32400;

        if (token) {    // If we have a token - lets use it to get client access to Plex and setup Monitoring and get some basic plex info
            try {

                // Authenticate first again the myplex.tv - to get the local server if we haven't selected a server to use

                // Plex API client - lets just use a token we saved after the PIN authentication
                client = new PlexAPI({
                    "token": token,
                    "hostname": serverToUse,
                    "port": port
                });

                setupWSMonitoring();

                defer.resolve();
            }
            catch (e) {
                logger.info("Failed to connect:" + e);
                client = null;
                defer.reject("Failed to connect with Token")
            }
        } else {
            logger.info("No Token - please link Plex Account");
            client = null;
            defer.reject("No Token");
        }

        return defer.promise;
    }

    var cache = cachemanager.caching({
        store: 'memory',
        max: 50000,
        ttl: config.get('timeOut')
    });

    var cacheGet = function(key) {
        return cache.get(key);
    };

    var cacheSet = function(key, value) {
        cache.set(key, value);
    };

    var cacheRemove = function() {};

    var cacheReset = function() {
        cache = cachemanager.caching({
            store: 'memory',
            max: 50000,
            ttl: config.get('timeOut')
        });
    };

    // WS Monitoring support
    var setupWSMonitoring = function() {
        // Create a WebsocketClient with the create plex-api login and onPacket function
        const WSClient = new PlexWebsocket.WebsocketClient(client, onPacket);
        WSClient.websocket.on("connect", function() {logger.info("PlexAPI: Connected")}); // When a successful connection is made
        WSClient.websocket.on("error", function(err) { logger.info("PlexAPI: Error\n", err)}); // When an error occurs (Will terminate program)
        WSClient.websocket.on("debug", function(message) { logger.info("PlexAPI: Debug\n", message)});
    }

    /**
     * @param {PlexWebsocket.types} type
     * @param {object} data
     */
    function onPacket(type, data) {
        if (type === PlexWebsocket.WebsocketClient.PACKETTYPES.PLAYING) {
//            logger.info("PlexAmp:: Callback:: Playing State Change");
//            logger.info("PlexAmp:: Callback:: Session IDs: ", data.PlaySessionStateNotification.map(session => session.sessionKey).join(", "));
//            logger.info("PlexAmp:: Callback:: Rating Keys: ", data.PlaySessionStateNotification.map(session => session.ratingKey).join(", "));
//            logger.info("PlexAmp:: Callback:: States: ", data.PlaySessionStateNotification.map(session => session.state).join(", "));
        }
    }

    var queryAllMusicLibraries = function() {
        var defer = libQ.defer();
        var promises = [];	// Array to gather all the various promises
        // Query all the servers first
        query("/servers").then((servers) => {
            for (var i = 0;i<servers.size; i++ ) {
                var server = servers.Server[i];
                // Then query the list of Music libraries on the server
                promises.push(queryLibraries(server.name, server.address, server.port));
            }
            var listOfMusicLibraries = [];
            Promise.all(promises).then(function(serverMusicLibraries) {
                for (const serverLibrary of serverMusicLibraries) {
                    for (const musicLibrary of serverLibrary.libraries) {
                        listOfMusicLibraries.push({
                            "name": serverLibrary.name,
                            "hostname": serverLibrary.hostname,
                            "port": serverLibrary.port,
                            "libraryTitle": musicLibrary.title,
                            "key": musicLibrary.key
                        });
                    }
                }
                defer.resolve(listOfMusicLibraries);
            });
        }).fail(function(error){
            self.logger.info("PlexAmp::Plex failed to query servers " +  error);
            defer.reject(error);
        });

        return defer.promise;
    }



    /**
     * Main query method on the plex-API - key that we cache the result
     * @param options
     * @returns {Promise}
     */
    var query = function(options) {
        var self = this;
        var defer = libQ.defer();

        const cacheKey = JSON.stringify(options);
        var cached = cacheGet(cacheKey )
            .then(function(cached) {
                if (cached === undefined) {
                    if (client === null) defer.reject(new Error("Not connected"));
                    client.query(options)
                        .then(function(result) {
                            // Most query result in a Mediacontrainer and most mediacontainers contain Metadata
                            if (result.MediaContainer) {
                                if (result.MediaContainer.Metadata) {
                                    cacheSet(cacheKey, result.MediaContainer.Metadata);
                                    defer.resolve(result.MediaContainer.Metadata);
                                } else {
                                    cacheSet(cacheKey, result.MediaContainer);
                                    defer.resolve(result.MediaContainer);
                                }
                            } else {
                                cacheSet(cacheKey, result);
                                defer.resolve(result);
                            }
                        }, function (err) {
                            logger.info("PlexAmp::" + err.message);
                            defer.reject(new Error(err.message));
                        });
                } else {
//                    logger.info("Plexamp: ********** Cache hit:" + cacheKey);
                    defer.resolve(cached);
                }
            });
        return defer.promise;
    };

    /**
     * Same as the Query according to the plex-api documentation except does a post - so lets cache the results also
     * I.e. assuming it doesn't change something on the server
     * @param options
     * @returns {Promise}
     */
    var postQuery = function(options) {
        var defer = libQ.defer();

        var cached = cacheGet(JSON.stringify(options))
            .then(function(cached) {
                if (cached === undefined) {
                    if (client === null) defer.reject(new Error("Not connected"));
                    client.postQuery(options)
                        .then(function(result) {
                            if (result.MediaContainer) {
                                cacheSet(JSON.stringify(options) , result.MediaContainer);
                            }
                            defer.resolve(result.MediaContainer);
                        }, function (err) {
                            logger.info("PlexAmp::" + err.message);
                            defer.reject(new Error(err.message));
                        });
                } else {
                    defer.resolve(cached);
                }
            });
        return defer.promise;
    };

    /**
     * The Plex search function !
     *
     * @param options
     * @returns {Promise}
     */
    var findMusic = function(options) {
        var defer = libQ.defer();

        var cached = cacheGet(JSON.stringify(options))
            .then(function(cached) {
                if (cached === undefined) {
                    if (client === null) defer.reject(new Error("Not connected"));
                    client.find(options, {type: "artist"})  // A Plex Music "Library" is organised by Artist (currently)
                        .then(function(result) {
                            if (result) {
                                cacheSet(JSON.stringify(options) , result);
                            }
                            defer.resolve(result);
                        }, function (err) {
                            logger.info("PlexAmp::" + err.message);
                            defer.reject(new Error(err.message));
                        });
                } else {
                    defer.resolve(cached);
                }
            });
        return defer.promise;
    };

    var findPlaylists = function(options) {
        var defer = libQ.defer();
        var cached = cacheGet(JSON.stringify(options))
            .then(function(cached) {
                if (cached === undefined) {
                    if (client === null) defer.reject(new Error("Not connected"));
                    client.find(options, {type: "playlist", playlistType: "audio"})
                        .then(function(result) {
                            if (result) {
                                cacheSet(JSON.stringify(options) , result);
                            }
                            defer.resolve(result);
                        },function(err) {
                            logger.info("PlexAmp: Error " + err );
                            defer.reject(new Error("get"));
                        });
                } else {
                    defer.resolve(cached);
                }
            });
        return defer.promise;
    };

    var getArtistArt = function(artist) {
        var defer = libQ.defer();

        var uri = "https://us-central1-metavolumio.cloudfunctions.net/metas?artist=" + artist + "&mode=artistArt";
        unirest
            .get(uri)
            .strictSSL(false)
            .end(function(response) {
                if (response.ok) {
                    defer.resolve(response.body);
                } else {
                    defer.reject(new Error('getArtistArt'));
                }
            });
        return defer.promise;
    };

    var searchForTracks = function(musicSectionKey, trackName) {
        return query("/library/sections/" + musicSectionKey + "/search?title=" + trackName +"&type=10");
    };
    var searchForAlbums = function(musicSectionKey, albumName, limit) {
        return query("/library/sections/" + musicSectionKey + "/search?title=" + albumName +"&type=9");
    };
    var searchForArtists = function(musicSectionKey, artistName, limit) {
        return query("/library/sections/" + musicSectionKey + "/search?title=" + artistName +"&type=8");
    };

    var getArtistsFirstLetters = function(musicSectionKey, letter) {
        return query({uri:"/library/sections/" + musicSectionKey + "/firstCharacter" + (letter === undefined?"":"/" + letter) +"?type=8"});
    }

    var getAlbumsFirstLetters = function(musicSectionKey, letter) {
        return query({uri:"/library/sections/" + musicSectionKey + "/firstCharacter" + (letter === undefined?"":"/" + letter)  +"?type=9"});
    }

    var getAllArtists = function(musicSectionKey, startAt, limit) {
        return query({uri:"/library/sections/" + musicSectionKey + "/all?sort=title:asc&type=8", extraHeaders: {
                "X-Plex-Container-Start": startAt,
                "X-Plex-Container-Size": limit
            }});
    }

    var getAllAlbums = function(musicSectionKey, startAt, limit) {
        return query({uri:"/library/sections/" + musicSectionKey + "/all?type=9", extraHeaders: {
                "X-Plex-Container-Start": startAt,
                "X-Plex-Container-Size": limit
            }});
    }


    var getListOfRecentAddedAlbums = function(key, limit) {
        return query({uri:"/library/recentlyAdded/" + key + "/all?type=9&sort=addedAt:desc&includeMeta=1&includeAdvanced=1", extraHeaders: {
                "X-Plex-Container-Start": "0",
                "X-Plex-Container-Size": limit
            }});
    }
    var getListOfRecentAddedArtists = function(key, limit) {
        return query({uri:"/library/sections/" + key + "/all?viewCount>=1&type=8&sort=addedAt:desc", extraHeaders: {
                "X-Plex-Container-Start": "0",
                "X-Plex-Container-Size": limit
            }});
    }

    var getListOnDeck = function(key, limit) {
        return query({uri:"/library/onDeck", extraHeaders: {
                "X-Plex-Container-Start": "0",
                "X-Plex-Container-Size": limit
            }});
    }


    var getListOfRecentPlayedArtists = function(key, limit) {
        return query({uri:"/library/sections/" + key + "/all?viewCount>=1&type=8&sort=lastViewedAt:desc", extraHeaders: {
                "X-Plex-Container-Start": "0",
                "X-Plex-Container-Size": limit
            }});
    }
    var getListOfRecentPlayedAlbums = function(key, limit) {
        return query({uri:"/library/sections/" + key + "/all?viewCount>=1&type=9&sort=lastViewedAt:desc", extraHeaders: {
                "X-Plex-Container-Start": "0",
                "X-Plex-Container-Size": limit
            }});
    }

    var getListOfRecentPlaylists = function (key, limit) {
        return query({uri:"/playlists/all?type=15&sort=lastViewedAt:desc&playlistType=audio", extraHeaders: {
                "X-Plex-Container-Start": "0",
                "X-Plex-Container-Size": limit
            }});
    }

    var getListOfPlaylists = function(key) {
        return findPlaylists({uri:"/playlists", key: key });
    }

    var getPlaylist = function(key, startAt, limit) {
        return query(key +"?X-Plex-Container-Start=" + startAt + "&X-Plex-Container-Size=" +limit);
    }
    /*
    var getAlbumsByArtist = function(artistKey) {
        return query({uri:artistKey + "/all?type=9"});
    }*/

    var getListOfMusicLibraries = function() {
        return findMusic({uri:"/library/sections/"});
    }
    var getAlbumTracks = function(key) {
        return query("/library/metadata/" +key + "/children");
    }

    var getAlbumsByArtist = function(artistKey) {
        return query({uri:"/library/metadata/" + artistKey + "/children"});
    }

    var getAlbumRelated = function(key) {
        return query( "/library/metadata/" + key + "/related");
    }
    var getArtistRelated = function(key) {
        return query( "/library/metadata/" + key + "/related") ;
    }
    var getArtistRadio = function(key) {
        return query( "/library/metadata/" +key + "/station?type=10") ;
    }
    var getArtist = function(key) {
        return query( "/library/metadata/" +key +"?includeExtras=1&includeOnDeck=1&includePopularLeaves=1&includeReviews=1&includeChapters=1&includeStations=1&includeExternalMedia=1") ;
    }
    var getAlbum = function(key) {
        return query( "/library/metadata/" + key + "?includeExtras=1&includePopularLeaves=1&includeReviews=1");
    }

    var getTrack = function(key) {
        return query( "/library/metadata/" + key);
    }
    return {
        isConnected: isConnected,
        queryLibraries: queryLibraries,
        queryAllMusicLibraries: queryAllMusicLibraries,
        connect: connect,
        cacheGet: cacheGet,
        cacheSet: cacheSet,
        cacheRemove: cacheRemove,
        cacheReset: cacheReset,
        query: query,
        postQuery: postQuery,
        findMusic: findMusic,
        findPlaylists: findPlaylists,
        getArtistArt: getArtistArt,
        getArtistsFirstLetters:getArtistsFirstLetters,
        getAlbumsFirstLetters: getAlbumsFirstLetters,
        getArtistRelated:getArtistRelated,
        getArtist: getArtist,
        getArtistRadio:getArtistRadio,
        getAllArtists: getAllArtists,
        getAllAlbums: getAllAlbums,
        getListOfRecentAddedAlbums: getListOfRecentAddedAlbums,
        getListOfRecentAddedArtists: getListOfRecentAddedArtists,
        getListOnDeck: getListOnDeck,
        getListOfRecentPlayedAlbums: getListOfRecentPlayedAlbums,
        getListOfRecentPlayedArtists:getListOfRecentPlayedArtists,
        getListOfRecentPlaylists: getListOfRecentPlaylists,
        getListOfPlaylists: getListOfPlaylists,
        getPlaylist:getPlaylist,
        getListOfMusicLibraries:getListOfMusicLibraries,
        getAlbumsByArtist:getAlbumsByArtist,
        getAlbumTracks: getAlbumTracks,
        getAlbumRelated: getAlbumRelated,
        getAlbum: getAlbum,
        getTrack: getTrack,
        searchForTracks: searchForTracks,
        searchForAlbums:searchForAlbums,
        searchForArtists:searchForArtists
    };

};
