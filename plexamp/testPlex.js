
var plex = require('./plex');
const PlexPin = require('./plexpinauth');

class Logger {
    info = (message) => {console.log(message);}
}
class Config  {
    constructor() {
        this.map = {
            "token": process.env.TOKEN,
            "server": process.env.HOSTNAME,
        };
    }
    get = (key) => {
        return this.map[key];
    };
}


var plexBackend = new plex(new Logger(), new Config());

plexBackend.connect().then(function(){

    plexBackend.query("/servers").then((result) => {
        console.log(result);
    })

    // A couple of tests - lets look for the servers
    getListOfMusicLibraries().then(function (result) {
        console.log("%s running Plex Media Server %s", result.friendlyName, result.version);

        var musicLibrary = result.filter((library) => library.title === 'Music');

        doAllMusicQueryTests(musicLibrary[0].key);

    }, function (err) {
        console.error("Could not connect to server", err);
    });

});

function doAllMusicQueryTests(musicSectionKey) {

    /*
    getListOfMusicServers().then((results) => {
        for (const server of results) {
            console.log("Music Section Title [" + server.title + "] key: [ " + server.key + " ]");
        }
    });*/
/*
    getListOfPlaylists(1).then((results) => {
        for (const playlist of results) {
            console.log("Playlist Title [" + playlist.title + "] key: [ " + playlist.key + " ] Total Tracks:[ " + playlist.leafCount + " ]");
        }
    });
    */
    // Should be key of 12 in our example:
/*    getListOfPlaylists(12).then((results) => {
        for (const playlist of results) {
            console.log("Playlist Title [" + playlist.title + "] key: [ " + playlist.key + " ] Total Tracks:[ " + playlist.leafCount + " ]");
        }
    });
*/
    /*
    getAllAlbums(musicSectionKey).then((artists)=> {
        console.log(JSON.stringify(artists));
    });*/
    /*
    getAllArtists().then((artists)=> {
        console.log(JSON.stringify(artists));
    });

     */
    getAlbumDetails("/library/metadata/236778/children").then((albumDetails) => {
       console.log(JSON.stringify(albumDetails));
    });
    getAlbumDetails("/library/metadata/236778?related").then((albumDetails) => {
        console.log(JSON.stringify(albumDetails));
    });
    /*
    getTrack("/library/metadata/113056").then((media) => {

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
    getPlaylist("/playlists/110226/items").then((playlist) => {
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

    }).fail((err) => {
      console.log(err);
    });
*/


    /*
        getListOfRecentPlaylists(12).then((results) => {
            for (const album of results) {
                console.log("Music Section Title [" + album.title + "] artist:[" + album.parentTitle + "] key: [ " + album.key + " ]");
            }
        });
*/
    /*
    getListOfRecentAddedAlbums(1).then((results) => {
        for (const album of results) {
            console.log("Music Section Title [" + album.title + "] artist:[" + album.parentTitle + "] key: [ " + album.key + " ]");
        }
    });
     */
/*
    getListOfRecentPlayedAlbums(1).then((results) => {
        for (const album of results) {
            console.log("Music Section Title [" + album.title + "] artist:[" + album.parentTitle + "] key: [ " + album.key + " ]");
        }
    });
    getAlbumDetails("/library/metadata/112974/children").then((results) => {
        console.log("Artist: [" + results.title1 + "] Album [" + results.title2 + "] summary: [" + results.summary + "]");
        for (const track of results.Metadata) {
            printTrackDetails(track);
        }
        getMetadata("112974").then((result) => {
            console.log(result);
        });
    });
     */
}

function getMetadata(key) {
    return plexBackend.query("/library/metadata/" + key + "?context=library:hub.music.recent.played");
}

function  getTrack(key) {
    var self = this;
    return plexBackend.query(key);
}

function getListOfMusicLibraries () {
    var self = this;
    return plexBackend.findMusic({uri:"/library/sections/"});
}

function printTrackDetails(track) {
    console.log(" Track: " + track.title + " length:" + track.duration + " type:" + track.Media[0].audioCodec);
    console.log(" stream URL:" + track.Media[0].Part[0].key + "?download=1");
}

function getAllArtists() {
    var self = this;
    var musicSectionKey = 1;	// Get this from the config - It's the key of the music folder
    return plexBackend.query({uri:"/library/sections/" + musicSectionKey + "/all?type=8", source: musicSectionKey})
        .then(function(hub) {
            return hub.Metadata;
        }, function(error) {
            console.log("Error" + error.message);
        });
}

function getAllAlbums(musicSectionKey) {
    var self = this;
    return plexBackend.query({uri:"/library/sections/" + musicSectionKey + "/all?type=9"})
        .then(function(hub) {
            return hub.Metadata;
        }, function(error) {
            console.log("Error" + error.message);
        });
}

function getListOfMusicServers() {
    return plexBackend.findMusic({uri:"/library/sections/"});
}

function getAlbumDetails(key) {
    return plexBackend.query(key);
}
/**
 * Recent Albums from Hub View (possible replace with Search sorted by date with limit)
 * @param key
 * @returns {*}
 */
function getListOfRecentAddedAlbums(key) {
    return plexBackend.query({uri:"/library/sections/" + key + "/all?type=9&sort=addedAt:desc", extraHeaders: {
            "X-Plex-Container-Start": "0",
            "X-Plex-Container-Size": "100"
    }}).then((hub) => {
        return hub.Metadata;
    });
}

/**
 * type= 8 (for artists) = 9 for albums
 * @param key
 * @returns {*}
 */
function getListOfRecentPlayedAlbums(key) {
    return plexBackend.query({uri:"/library/sections/" + key + "/all?viewCount>=1&type=9&sort=lastViewedAt:desc", source: key, extraHeaders: {
            "X-Plex-Container-Start": "0",
            "X-Plex-Container-Size": "100"
    }}).then((hub) => {
        return hub.Metadata;
    });
}

function getListOfRecentPlaylists(key) {
    return plexBackend.query({uri:"/playlists/all?type=15&sort=lastViewedAt:desc&playlistType=audio"}).then((hub) => {
        if (hub.size == 1) {
            return hub.Hub[0].Metadata;
        }
        return [];
    });
}

function getListOfPlaylists(key) {
    return plexBackend.findPlaylists({uri:"/playlists", key: key });
}

function getPlaylist(key) {
    return plexBackend.query(key);
}

function printMusicSectionDetils(musicSection) {
    plexBackend.findMusic({
        "uri": "/library/sections/" + musicSection.key + "/all",
        extraHeaders: {
            "X-Plex-Container-Start": "0",
            "X-Plex-Container-Size": "100"
        }
    }).then(function (musicSection) {
        console.log(musicSection);
        for (const metadata of musicSection) {
            console.log(metadata.title);
        }
    }, function (err) {
        console.log(err);
    });
}

function printPlaylistDetails(playlist) {
    // Filter for audio only playlists
    if (playlist.playlistType === 'audio') {
        // Print title then list tracks
        console.log("Playlist Title: [" + playlist.title + "]");

        // get all the tracks in this playlist
        plexBackend.query({
            uri:playlist.key + "/all",
            extraHeaders: {
                "X-Plex-Container-Start": "0",
                "X-Plex-Container-Size": "100"
            }
        }).then(function(playlistResult) {
            for (const track of playlistResult) {
                console.log(" Track: [" + track.title +"] Media: " + track.Media);
            }
        }, function(err) {
            console.log(err);
        });
    }
}

function printHubDetails(hub) {
    console.log(hub.title);
    for (const media of hub.Metadata) {
        console.log(media.title);
    }
}

var Plexcloud = require('./plexcloud');


var plexcloud = Plexcloud({
    identifier: '983-ADC-213-BGF-132',
    product: 'Volumio-PlexAmp',
    version: '1.0',
    deviceName: 'RaspberryPi',
    platform: 'Volumio'
});
plexcloud.getServers(process.env.TOKEN, function (servers) {
    console.log(JSON.stringify(servers));
});

/*
 * Get a PIN
 *
 * The following code retrieves a PIN and waits for the user to enter the PIN on plex.tv so a token can be retrieved.
 * A PIN is valid for 15 minutes and after that this script will timeout.
 *
 */
/*
plexPin.getPin().then(pin =>
{
    // print pin
    console.log(pin.code);

    // get token
    let ping = setTimeout(function pollToken()
    {
        plexPin.getToken(pin.id)
            .then(res =>
            {
                // success getting token
                if (res.token === true)
                {
                    console.log(res['auth-token']);
                    return;
                }

                // failed getting token
                else if (res.token === false)
                {
                    console.error('Timeout!');
                    return;
                }

                // polling
                else
                    ping = setTimeout(pollToken, 1000);
            })
            .catch(err => console.error(JSON.stringify(err)));

    }, 2000);
})
    .catch(err => console.error(err.message));
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