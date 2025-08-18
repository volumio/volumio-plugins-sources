
var plex = require('./plex');
var libQ = require('kew');
var Plexcloud = require('./plexcloud');
const PlexPin = require('./plexpinauth');
require('dotenv').config()


var plexcloud = Plexcloud({
    identifier: '983-ADC-213-BGF-132',
    product: 'Volumio-PlexAmp',
    version: '1.0',
    deviceName: 'RaspberryPi',
    platform: 'Volumio'
});

class Logger {
    info = (message) => {console.log(message);}
}
class Config  {
    constructor() {
        this.map = {
            "token": process.env.TOKEN,
            "server": process.env.HOSTNAME,
            "port": process.env.PORT,
            "protocol": process.env.PROTOCOL
        };
    }
    get = (key) => {
        return this.map[key];
    };
}

/*
        query("/servers").then((servers) => {
 */


var plexBackend = new plex(new Logger(), new Config());

plexBackend.httpPing(process.env.LIBRARYNAME, process.env.HOSTNAME, process.env.PORT, process.env.PROTOCOL)
    .then((res) => {
        console.log("running");

        plexBackend.connect().then(function(){
            plexcloud.getServers(process.env.TOKEN, function (servers) {
                console.log("Plex Cloud result");
                var promises = [];	// Array to gather all the various promises

                for (const server of servers) {
                    console.log("ServerName:" + server.name);
                    promises.push(plexBackend.httpPing(server.name, server.address, server.port, server.protocol));
                }


                Promise.allSettled(promises).then(function(results) {
                    console.log("RESULTS: " + JSON.stringify(results));
                    const servers = results.filter(result => result.status === 'fulfilled').map(result => result.value);
                    plexBackend.queryAllMusicLibraries(servers).then(function (libraries) {

                        console.log(JSON.stringify(libraries));

                        for (const musicLibrary of libraries) {
                            console.log("Library called %s running on Plex Media Server %s", musicLibrary.libraryTitle, musicLibrary.hostname);
                        }
                        var filteredMusicLibrary = libraries.filter((library) => library.libraryTitle === 'Music' && library.name === process.env.LIBRARYNAME);

                        try {
                            doAllMusicQueryTests(filteredMusicLibrary[0].key);
                        } catch (Err) {
                            console.error(Err);
                        }
                    });
                });
            }, function(errorMessage) {
                console.log("Error:" + errorMessage);
            });


        });

    })
    .fail((err) => { console.log("not running"); });



function doAllMusicQueryTests(musicSectionKey) {

    /*
    plexBackend.getAlbumsFirstLetters(musicSectionKey).then((results) => {
        console.log(JSON.stringify(results));
    });

    plexBackend.getAlbumsFirstLetters(musicSectionKey, "S").then((results) => {
        for (const album of results) {
            console.log("Playlist Title [" + album.title + "] key: [ " + album.key + " ] Total Tracks:[ " + album.size + " ]");
        }
    });
    */
    var albumKey = "249959";
    plexBackend.getAlbumRelated(albumKey).then((albumTracks) => {
        console.log("Related:" + JSON.stringify(albumTracks));
        var similarAlbums = filterMetadataFromHub(albumTracks.Hub, "hub.external.album.similar.sonically");
        similarAlbums.forEach(function (album) {
            console.log(JSON.stringify(album));
        });
    });

    function filterMetadataFromHub(hubs, context) {
        for (const hub of hubs ) {
            if (hub.context === context) {
                return hub.Metadata;
            }
        }
        return [];
    }
    /*
    plexBackend.getListOfPlaylists(musicSectionKey).then((results) => {
        for (const playlist of results) {
            console.log("Playlist Title [" + playlist.title + "] key: [ " + playlist.key + " ] Total Tracks:[ " + playlist.leafCount + " ]");
        }
    });
    */
    /*
    plexBackend.getAllAlbums(musicSectionKey).then((artists)=> {
        console.log(JSON.stringify(artists));
    });
     */
    /*
    plexBackend.getAllArtists().then((artists)=> {
        console.log(JSON.stringify(artists));
    });

     */
    /*
    plexBackend.getAlbumDetails("113385/children").then((albumDetails) => {
       console.log(JSON.stringify(albumDetails));
    });
    plexBackend.getAlbumDetails("113385/related").then((albumDetails) => {
        console.log(JSON.stringify(albumDetails));
    });*/
    /*
    plexBackend.getTrack("113056").then((media) => {

        var song = media.Metadata[0];
        var track = {
            service: 'plexamp',
            name: song.title,
            title: song.title,
            duration: song.duration,
            artist: song.grandparentTitle,
            artistId: song.grandparentKey,
            album: song.parentTitle,
            albumId: song.parentKey,
            genre: song.parentStudio,
            type: "song",
            albumart: song.parentThumb,
            uri: song.Media[0].Part[0].key,
            samplerate: song.Media[0].bitrate + " kbps",
            trackType: song.Media[0].audioCodec,
            streaming: true
        }
        console.log(JSON.stringify(track));
    });
    */
    /*
    plexBackend.getPlaylist("/playlists/110226/items").then((playlist) => {
        var items = [];

        function _formatSong(song, curUri) {
            var item = {
                service: 'plexamp',
                type: 'song',
                title: song.title,
                artist: song.grandparentTitle,	// Parent of track is the album and grandparent is the artist
                albumart: song.parentThumb,
                uri: 'plexamp/track/' + encodeURIComponent( song.key ),
            }
            return item;
        }

        if (playlist.Metadata !== undefined) {
            playlist.Metadata.forEach(function (song) {
                items.push(_formatSong(song));
            });
        }
        console.log(items);

        plexBackend.getPlaylist("/playlists/110226/items");

    }).fail((err) => {
      console.log(err);
    });

     */
    /*
    plexBackend.searchForAlbums(musicSectionKey, "Born to Run", 100).then(function(albumResults) {
        if (albumResults.size == 0) {
            console.log("Not found");
        } else {
            console.log(JSON.stringify(albumResults));
        }
    });

    plexBackend.searchForTracks(musicSectionKey, "Born to Run", 100).then(function(songResults) {
        console.log(JSON.stringify(songResults));
    });

     */

    /*
        plexBackend.searchForArtists(musicSectionKey, "Radio", 100).then(function(artistsResults) {
            var self = this;
            self.artistsResults = artistsResults;
            for (const artist of artistsResults) {
                plexBackend.getArtist( artist.ratingKey).then(function(artistDetails) {
                    console.log(JSON.stringify(artistDetails));
                    plexBackend.getAlbumsByArtist(artist.ratingKey).then(function(albums) {
                        for (const album of albums) {
                            console.log(JSON.stringify(album));
                        }
                    });
                });
            }
        });

     */
    /*
    plexBackend.getAllArtists(musicSectionKey).then(function(allArtists) {
       console.log("All Artists received:" + allArtists.length);
    });

     */
/*
    plexBackend.getListOfPlaylists(musicSectionKey).then(function(listPlaylists) {
       console.log(listPlaylists);
    });
*/
    /*
    plexBackend.getPlaylist("/playlists/110225/items", 0,1000).then(function(artistRadio) {
        console.log(artistRadio);
    });

     */
    /*
    plexBackend.getArtist("42627").then(function(artist) {
       console.log(artist);

    });
    plexBackend.getArtistRelated("42627").then(function(artist) {
        console.log(artist);
    });
    */
    plexBackend.getAlbum("249959").then(function(album) {
        console.log(album);
    });
    /*
    plexBackend.getAlbumRelated("42628").then(function(related) {
       console.log(related);
    });
    plexBackend.getAlbumTracks("42628").then(function(tracks) {
        console.log(tracks);
    });

 */

    /*
        plexBackend.getListOfRecentPlaylists(musicSectionKey).then((results) => {
            for (const album of results) {
                console.log("Music Section Title [" + album.title + "] artist:[" + album.parentTitle + "] key: [ " + album.key + " ]");
            }
        });
*/
    plexBackend.getListOfRecentAddedAlbums(musicSectionKey, 100).then((results) => {
        for (const album of results) {
            console.log("Music Section Title [" + album.title + "] artist:[" + album.parentTitle + "] key: [ " + album.key + " ]");
        }
    });
    plexBackend.getListOfRecentAddedArtists(musicSectionKey).then((results) => {
        for (const artist of results) {
            console.log("Music Section Artist [" + artist.title + "] key: [ " + album.key + " ]");
        }
    });
    plexBackend.getListOfRecentPlayedArtists(musicSectionKey).then((results) => {
        for (const album of results) {
            //console.log("Music Section Title [" + album.title + "] artist:[" + album.parentTitle + "] key: [ " + album.key + " ]");
        }
        console.log("Recently Played:" + results.length)
    });
    /*
    var albumKey = 112974;
    plexBackend.getAlbumDetails(+albumKey).then((results) => {
        var album = results[0];
        console.log("Artist: [" + album.title1 + "] Album [" + album.title2 + "] summary: [" + album.summary + "]");

        plexBackend.getMetadata(albumKey).then((result) => {
            console.log("AlbumMetadata:" + JSON.stringify(result));
        });

        plexBackend.query(album.parentKey).then((metadata) => {
            console.log("ArtistMetadata:" + JSON.stringify(metadata));
        });
    });

    plexBackend.getAlbumDetails( + albumKey + "/children").then((albumTracks) => {
        for (const track of albumTracks) {
            printTrackDetails(track);
        }
    })
     */
    /*
    var bandToFind = "Born";
    plexBackend.searchForAlbums(musicSectionKey, bandToFind).then((results) => {
       console.log(JSON.stringify(results));
    });
     */
}

function getMetadata(key) {
    return plexBackend.query( + key);
}


function printTrackDetails(track) {
    console.log(" Track: " + track.title + " length:" + track.duration + " type:" + track.Media[0].audioCodec);
    console.log(" stream URL:" + track.Media[0].Part[0].key + "?download=1");
}

/*
plexcloud.getClaimToken(process.env.TOKEN, function (claimToken) {
    console.log("Plex Cloud result" + JSON.stringify(claimToken));
}, function error() {
    console.log("error getting claim tokens");
});
 */

/*
 * Get a PIN
 *
 * The following code retrieves a PIN and waits for the user to enter the PIN on plex.tv so a token can be retrieved.
 * A PIN is valid for 15 minutes and after that this script will timeout.
 *
 */

function processToken(res) {
    var defer = libQ.defer();

    console.log('result: ' + JSON.stringify(res));
    // success getting token
    if (res.token === true) {
        console.log(res['auth-token']);
        defer.resolve(res['auth-token']);
    } else {
        console.log('rejecting');
        defer.reject(res);
    }
    return defer.promise;
};


function processPinAndToken (pin) {
    // print pin
    console.log(pin.code);

    // get token
    let ping = setTimeout(function pollToken() {
        console.log('get token for pin: ' + pin.id);
        plexPin.getToken(pin.id)
            .then((res) => processToken(res))
            .fail((res) => {
                var defer = libQ.defer();

                console.log('failure handler' + JSON.stringify(res));
                // failed getting token
                if (res.token === false) {
                    console.error('Timeout!');
                    return null;
                } else if (res.token === null) {
                    ping = setTimeout(pollToken, 1000);
                } else {
                    console.log(res);
                    return null;
                }

                defer.reject();

                return defer.promise;
            })
            .then(() => console.error("no failure"));

    }, 2000);
}


/*
const plexPin = new PlexPin({
        identifier: '983-ADC-213-BGF-132',      // Some unique ID
        product: 'Volumio-PlexAmp',     // Some suitable name for this plugin when it appears in Plex
        version: '1.0',
        deviceName: 'RaspberryPi',      // Maybe query the device Id eventually
        platform: 'Volumio'
    });


plexPin.getPin()
    .then((pin) => processPinAndToken(pin))
    .fail(err => console.error(err.message));
*/

/*
 * Get a token
 *
 * If you only wish to verify a PIN, use the following script
 *
 */
/*
plexPin.getToken(6566262696).then(res => // fake PIN
{
	// success getting token
	if (res.token === true)
		console.log(res['auth-token']);

	// failed getting token
	else if (res.token === false)
		console.error('Timeout!');

	// polling
	else
		console.error('No token found!');
})
.catch(err => console.error(err.message));
*/
