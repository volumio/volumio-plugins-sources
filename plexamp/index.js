'use strict';

var libQ = require('kew');
var plex = require('./plex');
const PlexPin = require('./plexpinauth');
const PlexCloud = require("./plexcloud");
const fs = require("fs");
const path = require("path");
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


module.exports = ControllerPlexAmp;
function ControllerPlexAmp(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}

/**
 * Standard volumio event handlers
 */

ControllerPlexAmp.prototype.onVolumioStart = function() {
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

	return libQ.resolve();
}

ControllerPlexAmp.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();

	self.plex = new plex(self.commandRouter.logger, self.config);

	self.mpdPlugin = self.commandRouter.pluginManager.getPlugin('music_service', 'mpd');

	self.commandRouter.loadI18nStrings();
	self.commandRouter.updateBrowseSourcesLang();

	self.plex.connect()
		.then(function(){
			self.commandRouter.logger.info("PlexAmp::Plex initialised" + self.plex);
			self.addToBrowseSources();

			// Once the Plex is connected we successfully started so resolve the promise
			defer.resolve();
		})
		.fail(function(error){
			self.commandRouter.logger.info("PlexAmp::Plex failed to connect");
			defer.reject(error);
		});

    return defer.promise;
};

ControllerPlexAmp.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

ControllerPlexAmp.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
	self.commandRouter.logger.info("PlexAmp::Plex restarted?");

};

ControllerPlexAmp.prototype.getI18nFile = function (langCode) {
	const i18nFiles = fs.readdirSync(path.join(__dirname, 'i18n'));
	const langFile = 'strings_' + langCode + '.json';

	// check for i18n file fitting the system language
	if (i18nFiles.some(function (i18nFile) { return i18nFile === langFile; })) {
		return path.join(__dirname, 'i18n', langFile);
	}
	// return default i18n file
	return path.join(__dirname, 'i18n', 'strings_en.json');
}

// PIN Configuration Methods -----------------------------------------------------------------------------

ControllerPlexAmp.prototype.getPinAndUpdateField = function(data) {
	var defer = libQ.defer();
	var self = this;

	var lang_code = self.commandRouter.sharedVars.get('language_code');

	self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
		__dirname+'/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then(function(uiconf) {

			var sysversionf = self.commandRouter.executeOnPlugin('system_controller', 'system', 'getSystemVersion', '')
			sysversionf.then(function(info) {
				try {
					self.logger.info("PlexAmp:: System Info" + JSON.stringify(info));
				} catch (e) {
					self.logger.info("unable to query system information")
				}
			});

					// TODO: Get offial values from Volumio somehow !!
			var plexCloudOptions = {
				identifier: '983-ADC-213-BGF-132',
				product: 'Volumio-PlexAmp',
				version: '1.0',
				deviceName: 'RaspberryPi',
				platform: 'Volumio'
			};

			const plexPin = new PlexPin(plexCloudOptions);

			plexPin.getPin().then(pin => {
				// This should enable the Link Plex Button - but first get a PIN to display

				let heading = self.commandRouter.getI18nString('PLEX_PIN');
				let modalData = {
					title: heading,
					message: "PIN: " + pin.code,
					size: 'lg',
					buttons: [{
						name: 'Close',
						class: 'btn btn-warning',
						emit: 'closeModals',
						payload: ''
					}]
				};
				self.commandRouter.broadcastMessage("openModal", modalData);

				// Clear the current token now as we should be using the new one we get back after linking
				self.config.set("token", "");
				self.config.save();

				defer.resolve(uiconf);

				// get token
				let ping = setTimeout(function pollToken() {
					plexPin.getToken(pin.id)
						.then(res => {
							// success getting token
							if (res.token === true) {
								var token = res['auth-token'];
								self.config.set('token', token);
								self.config.save();

								self.logger.info("PlexAmp::Saved new Token");

								// OK now we have a token - let query the plex cloud for a local server
								// Only because old Node JS Plex API library needs a server before it will work -
								// So we are using our own Plex Cloud library to query the list of servers and pick the first one
								var plexcloud = PlexCloud(plexCloudOptions);
								plexcloud.getServers(token, function (servers) {

									self.logger.info("PlexAmp::" + JSON.stringify(servers));
									var serverDetails = servers.MediaContainer.Server[0].$;
									var server = serverDetails.scheme + "://" + serverDetails.address + ":" + serverDetails.port;
									self.config.set('server', server);
									self.config.save();

									self.plex.connect()
										.then(function(){
											self.logger.info("PlexAmp::Plex initialised" + self.plex);
											self.addToBrowseSources();

											self.refreshUIConfig();
										})
										.fail(function(error){
											self.logger.info("PlexAmp::Plex failed to connect");
										});
								});

							}

							// failed getting token
							else if (res.token === false) {
								console.error('Timeout!');
							}
							else {
								ping = setTimeout(pollToken, 1000);
							}
						})
						.catch(err => console.error(JSON.stringify(err)));

				}, 2000);
			})
				.catch(err => console.error(err.message));

		})
		.fail(function(error) {
			console.log(error);
			defer.reject(error);
		});

	return defer.promise;
};


ControllerPlexAmp.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = self.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf) {
			var findOption = function(optionVal, options) {
				for (var i = 0; i < options.length; i++) {
					if (options[i].value === optionVal)
						return options[i];
				}
			};


			self.logger.info("PlexAmp::get UIConfig - retrieve current values");

			try {

				var token = self.config.get('token');	// Let assume for now if we have a token it valid
				if (token && token.length > 0) {
					// Maybe check if we are connected first
					uiconf.sections[0].content[0].value = true;	// Connected !!

					var server = self.config.get('server');
					var library = self.config.get('library');

					self.getListOfServers().then(function (servers) {
						self.logger.info("PlexAmp:: List music servers:" + JSON.stringify(servers));
						if (servers.size > 0) {	// Make the first server we find be the default one for now !!
							self.config.set("server", 'http://' + servers.Server[0].host + ':' + servers.Server[0].port);
							self.config.save();
						} else {
							defer.reject(new Error("No Plex Server found?"));
						}
						// Next query all servers and then all music libraries and show them in the list of libraries
						self.getListOfMusicLibraries().then(function (result) {
							self.logger.info("PlexAmp:: List music Libraries:" + JSON.stringify(result));
							uiconf.sections[1].content[0].hidden = false;
							uiconf.sections[1].content[0].value.value = library;
							uiconf.sections[1].content[0].value.label = library;
							result.forEach(function (libraryOpt) {
								uiconf.sections[1].content[0].options.push({
									value:libraryOpt.key,
									label:libraryOpt.title
								});
							} );

							uiconf.sections[1].content[1].value = findOption(self.config.get('timeOut'), uiconf.sections[1].content[1].options);
							uiconf.sections[1].content[1].hidden = false;

							defer.resolve(uiconf);
						});
					}).fail(function(error) {
						console.log(error);
						defer.reject(error);
					});
				} else {	// So if we are not connected show status
					uiconf.sections[0].content[0].value = false;	// Not connected !!
					defer.resolve(uiconf);
				}
			} catch(e) {
				console.log(e);
			}
        })
        .fail(function(error) {
			console.log(error);
			defer.reject(error);
        });

    return defer.promise;
};

ControllerPlexAmp.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

ControllerPlexAmp.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

ControllerPlexAmp.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

ControllerPlexAmp.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

ControllerPlexAmp.prototype.savePluginCredentials = function(data) {
	var self = this;
	var defer = libQ.defer();

	self.logger.info("PlexAmp::savePluginCredentials - save value: " + data['library']);

	self.config.set('library', data['library']);
	self.config.save();

	// TODO: Save PIN and then use the plex pin auth library to get a token based on the PIN

	self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('PLEXAMP_CREDENTIALS'), self.commandRouter.getI18nString('SAVED') + " !");

	//clearing mpd queue and cache in case of server change
	self.resetPlugin();

	defer.resolve();	// TODO: Move this into the callback when Pin code added
	return defer.promise;
};

ControllerPlexAmp.prototype.savePluginOptions = function(data) {
	var self = this;
	var defer = libQ.defer();

	self.config.set('timeOut', data['timeOut'].value);

	self.config.save();
	self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('PLEXAMP_OPTIONS'), self.commandRouter.getI18nString('SAVED') + " !");

	//clearing mpd playlist due to seeking depending on transcoding setting
	self.resetPlugin();

	defer.resolve();
	return defer.promise;
};

ControllerPlexAmp.prototype.resetPlugin = function() {
	var self = this;

	self.commandRouter.volumioClearQueue();
	self.plex.cacheReset();
};

/**
 * Need to refresh the UI once we get a token back from Plex
 */
ControllerPlexAmp.prototype.refreshUIConfig = function() {
	let self = this;

	setTimeout(function () {
		self.commandRouter.getUIConfigOnPlugin('music_service', 'plexamp', {}).then( function(config) {
			self.commandRouter.broadcastMessage('pushUiConfig', config);
		});
		self.commandRouter.closeModals();
	}, 100);

}
// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


ControllerPlexAmp.prototype.addToBrowseSources = function () {
	var self = this;

	var data = {
		name: 'Plex',
		uri: 'plexamp',
		plugin_type: 'music_service',
		plugin_name: 'plexamp',
		albumart: '/albumart?sourceicon=music_service/plexamp/plexamp.png'
	};

    self.commandRouter.volumioAddToBrowseSources(data);
};


ControllerPlexAmp.prototype._prevUri = function(curUri) {
	var self = this;
	var lastIndex = curUri.lastIndexOf("/");
	return curUri.slice(0, lastIndex);
}

/*
 * A set of navivation helpers - copied and adapted from Volusonic
 */
ControllerPlexAmp.prototype._formatNav = function(title, type, icon, views, items, prevUri) {
	var self = this;
	var nav = {
		navigation: {
			lists: [{
				title: title,
				type: type,
				icon: icon,
				availableListViews: views,
				items: items
			}],
			prev: {
				uri: prevUri
			},
		}
	}
	return nav;
}


ControllerPlexAmp.prototype._formatPlaylist = function(playlist, curUri) {
	var self = this;
	var item = {
		service: 'plexamp',
		type: 'folder',
		title: playlist.title + ' (' + new Date(playlist.updatedAt).getFullYear() + ')',
		albumart: self._getPlaylistCover(playlist),
		icon: "",
		uri: curUri + '/' + encodeURIComponent(playlist.key)
	}
	return item;
}

ControllerPlexAmp.prototype._formatSong = function(song) {
	var self = this;
	var item = {
		service: 'plexamp',
		type: 'song',
		title: song.title,
		artist: song.grandparentTitle,	// Parent of track is the album and grandparent is the artist
		albumart: self.getAlbumArt(song.parentThumb),
		uri: 'plexamp/track/' + encodeURIComponent( song.key ),
	}
	return item;
}

ControllerPlexAmp.prototype._formatAlbum = function(album, curUri) {
	var self = this;
	var tit = album.title;

	var item = {
		service: 'plexamp',
		type: 'playlist',
		title: tit + ' (' + album.year + ')',
		artist: album.parentTitle,
		album: tit,
		albumart: self.getAlbumArt(album.thumb),
		icon: "",
		uri: curUri + '/' + encodeURIComponent(album.key)
	}
	return item;
}

ControllerPlexAmp.prototype._formatArtist = function(artist, curUri) {
	var self = this;

	var item = {
		service: 'plexamp',
		type: 'item-no-menu',
		title: artist.title,
		albumart: self.getAlbumArt(artist.thumb),
		icon: 'fa fa-microphone',
		uri: curUri + '/' + encodeURIComponent(artist.key)
	}
	return item;
};

ControllerPlexAmp.prototype._formatPlay = function(album, artist, coverart, year, duration, items, prevUri, curUri) {
	var self = this;
	var nav = {
		navigation: {
			lists: [{
				title: '',
				type: '',
				availableListViews: ['list', 'grid'],
				items: items
			}],
			prev: {
				uri: prevUri
			},
			info: {
				uri: curUri,
				service: 'plexamp',
				artist: artist,
				album: artist,
				albumart: coverart,
				year: year,
				type: 'album',
				duration: duration
			}
		}
	}
	return nav;
}


ControllerPlexAmp.prototype._getPlaylistCover = function(playlist, curUri) {
	return "";	// TODO: get playlist cover from plex
}

ControllerPlexAmp.prototype._getIcon = function(path) {
	var self = this;
	var icon = 'fa fa-music';

	switch (path) {
		case 'random':
			icon = 'fa fa-random';
			break;
		case 'newest':
			icon = 'fa fa-star';
			break;
		case 'genres':
			icon = 'fa fa-transgender-alt';
			break;
		case 'playlists':
			icon = 'fa fa-list-alt';
			break;
		case 'artists':
			icon = 'fa fa-microphone';
			break;
	}
	return icon;
}

/*
 *  A Series of Wrappers around the Plex API  - extracted so I can add more options (like extra metadata and paging) specific to the
 * API call itself
 */

ControllerPlexAmp.prototype.getAlbumDetails = function(key) {
	var self = this;
	return self.plex.query(key);
}

ControllerPlexAmp.prototype.getListOfServers = function() {
	var self = this;
	return self.plex.query({uri:"/servers"});
}

ControllerPlexAmp.prototype.getAlbumsByArtist = function(artistKey) {
	var self = this;
	return self.plex.query({uri:"/library/sections/" + artistKey + "/all?type=9"});

}
ControllerPlexAmp.prototype.getListOfMusicLibraries = function() {
	var self = this;
	return self.plex.findMusic({uri:"/library/sections/"});
}

ControllerPlexAmp.prototype.getArtistDetails = function(key) {
	var self = this;
	return self.plex.query(key);
}

ControllerPlexAmp.prototype.getTrack = function(key) {
	var self = this;
	return self.plex.query(key);
}

/**
 * Recent Albums from Hub View (possible replace with Search sorted by date with limit)
 * @returns {*}
 */
ControllerPlexAmp.prototype.getListOfRecentAddedAlbums = function(key) {
	var self = this;
	var musicSectionKey = key;
	return self.plex.query({uri:"/library/sections/" + musicSectionKey + "/all?type=9&sort=addedAt:desc", extraHeaders: {
			"X-Plex-Container-Start": "0",
			"X-Plex-Container-Size": "100"
		}})
		.then(function(hub) {
			return hub.Metadata;
		});
}

/**
 * type= 8 (for artists) = 9 for albums
 * @returns {*}
 */
ControllerPlexAmp.prototype.getAllArtists = function(key) {
	var self = this;
	var musicSectionKey = key;	// Get this from the config - It's the key of the music folder
	return self.plex.query({uri:"/library/sections/" + musicSectionKey + "/all?type=8", source: musicSectionKey})
		.then(function(hub) {
			return hub.Metadata;
		});
}

ControllerPlexAmp.prototype.getAllAlbums = function(key) {
	var self = this;
	var musicSectionKey = key;
	return self.plex.query({uri:"/library/sections/" + musicSectionKey + "/all?type=9", source: musicSectionKey})
		.then(function(hub) {
			return hub.Metadata;
		});
}

/**
 * type= 8 (for artists) = 9 for albums
 * @returns {*}
 */
ControllerPlexAmp.prototype.getListOfRecentPlayedAlbums = function(key) {
	var self = this;
	var musicSectionKey = key;
	return self.plex.query({uri:"/library/sections/" + musicSectionKey + "/all?viewCount>=1&type=9&sort=lastViewedAt:desc", source: musicSectionKey, extraHeaders: {
			"X-Plex-Container-Start": "0",
			"X-Plex-Container-Size": "100"
		}}).then(function (hub)  {
			return hub.Metadata;
		});
}

ControllerPlexAmp.prototype.getListOfRecentPlaylists = function(key) {
	var self = this;
	var musicSectionKey = key;
	return self.plex.query({uri:"/playlists/all?type=15&sort=lastViewedAt:desc&playlistType=audio", key: musicSectionKey })
		.then(function(hub) {
			if (hub.size === 1) {
				return hub.Hub[0].Metadata;
			}
			return [];
		});
}

ControllerPlexAmp.prototype.getListOfPlaylists = function(key) {
	var self = this;
	var musicSectionKey = key;	// Get this from the config - It's the key of the music folder
	return self.plex.findPlaylists({uri:"/playlists", key: musicSectionKey });
}

ControllerPlexAmp.prototype.getPlaylist = function(key) {
	var self = this;
	return self.plex.query(key);
}


ControllerPlexAmp.prototype.listPlaylists = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	// Call Play to get a list of playlists
	self.getListOfPlaylists()
		.then(function(playlists) {
			var items = [];

			for (const playlist of playlists) {
				items.push(self._formatPlaylist(playlist, curUri));
			}
			defer.resolve(self._formatNav('Playlists', 'folder', self._getIcon(uriParts[1]), ['list', 'grid'], items, self._prevUri(curUri)));
		})
		.fail(function(error) {
			var conErr = {
				title: self.commandRouter.getI18nString('CON_FAILED'),
				message: self.commandRouter.getI18nString('CON_SERVER_UNREACHABLE'),
				size: 'lg',
				buttons: [{
					name: 'Ok',
					class: 'btn btn-warning'
				}]
			}
			self.commandRouter.broadcastMessage("openModal", conErr);
		});

	return defer.promise;
}

ControllerPlexAmp.prototype.listNewestAlbums = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	// Get list of all the newest albums
	self.getListOfRecentAddedAlbums()
		.then(function(albums) {
			var items = [];

			for (const album of albums) {
				items.push(self._formatAlbum(album, curUri));
			}
			defer.resolve(self._formatNav('Recently Added Albums', 'folder', self._getIcon(uriParts[1]), ['list', 'grid'], items, self._prevUri(curUri)));
		})
		.fail(function(error) {
			var conErr = {
				title: self.commandRouter.getI18nString('CON_FAILED'),
				message: self.commandRouter.getI18nString('CON_SERVER_UNREACHABLE'),
				size: 'lg',
				buttons: [{
					name: 'Ok',
					class: 'btn btn-warning'
				}]
			}
			self.commandRouter.broadcastMessage("openModal", conErr);
		});

	return defer.promise;
}

ControllerPlexAmp.prototype.listPlayedAlbums = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	// Get list of all the newest albums
	self.getListOfRecentPlayedAlbums()
		.then(function(albums) {
			var items = [];

			for (const album of albums) {
				items.push(self._formatAlbum(album, curUri));
			}
			defer.resolve(self._formatNav('Recently Played Albums', 'folder', self._getIcon(uriParts[1]), ['list', 'grid'], items, self._prevUri(curUri)));
		})
		.fail(function(error) {
			var conErr = {
				title: self.commandRouter.getI18nString('CON_FAILED'),
				message: self.commandRouter.getI18nString('CON_SERVER_UNREACHABLE'),
				size: 'lg',
				buttons: [{
					name: 'Ok',
					class: 'btn btn-warning'
				}]
			}
			self.commandRouter.broadcastMessage("openModal", conErr);
		});

	return defer.promise;
}


/**
 * Check if we are connected and return status !!
 * @returns {Promise}
 */
ControllerPlexAmp.prototype.isConnected = function() {
	var self = this;
	var defer = libQ.defer();
	defer.resolve(true);	// TODO: Add a quick check to the Plex API
	return defer.promise;
}


/**
 * Show the Root Menu for this plugin
 */
ControllerPlexAmp.prototype.rootMenu = function() {
	var self = this;
	var nav = ({
		navigation: {
			prev: {
				uri: '/'
			},
			lists: [{
				title: "Server: " + self.config.get('server'),
				icon: "fa fa-server",
				availableListViews: ["list", "grid"],
				items: [
					{
						service: 'plexamp',
						type: 'item-no-menu',
						title: self.commandRouter.getI18nString('NEWEST_ALBUMS'),
						artist: '',
						album: '',
						icon: 'fa fa-star',
						uri: 'plexamp/newest'
					},
					{
						service: 'plexamp',
						type: 'item-no-menu',
						title: self.commandRouter.getI18nString('PLAYED_ALBUMS'),
						artist: '',
						album: '',
						icon: 'fa fa-music',
						uri: 'plexamp/played'
					},
					{
						service: 'plexamp',
						type: 'item-no-menu',
						title: self.commandRouter.getI18nString('PLAYLISTS'),
						artist: '',
						album: '',
						icon: 'fa fa-list-alt',
						uri: 'plexamp/playlists'
					},
					{
						service: 'plexamp',
						type: 'item-no-menu',
						title: self.commandRouter.getI18nString('ARTISTS'),
						artist: '',
						album: '',
						icon: 'fa fa-microphone',
						uri: 'plexamp/artists'
					},
					{
						service: 'plexamp',
						type: 'item-no-menu',
						title: self.commandRouter.getI18nString('ALBUMS'),
						artist: '',
						album: '',
						icon: 'fa fa-play',
						uri: 'plexamp/albums'
					},
				]
			}]
		}
	});
	return libQ.resolve(nav);
}


ControllerPlexAmp.prototype.listAllAlbums = function(uriParts, curUri) {
	var self = this;
	var defer = libQ.defer();
	var title;

	var result = self.getAllAlbums()
		.then( function(artist) {
			var items = [];
			if (artist.Metadata !== undefined) {
				artist.Metadata.forEach(function (album) {
					items.push(self._formatAlbum(album, curUri));
				});
			}
			defer.resolve(self._formatPlay(artist.title, artist.title, self.getAlbumArt(artist.key), new Date().toLocaleDateString(), artist.duration, items, self._prevUri(curUri), curUri));
		})
		.fail(function(result) {
			defer.reject(result);
		});
	return defer.promise;
}

ControllerPlexAmp.prototype.listTracks = function(uriParts, curUri) {
	var self = this;
	var defer = libQ.defer();
	var title;

	var key = decodeURIComponent(uriParts.pop());

	var result = self.getAlbumDetails(key)
		.then( function (album) {
			var items = [];
			if (album.Metadata !== undefined) {
				album.Metadata.forEach(function (song) {
					items.push(self._formatSong(song));
				});
			}
			defer.resolve(self._formatPlay(album.title, album.parentTitle, self.getAlbumArt(album.thumb), new Date().toLocaleDateString(), album.duration, items, self._prevUri(curUri), curUri));
		})
		.fail(function(result) {
			defer.reject(new Error('playlistEntrys'));
		});
	return defer.promise;
}


ControllerPlexAmp.prototype.playlistEntrys = function(uriParts, curUri) {
	var self = this;
	var defer = libQ.defer();
	var title;

	var key = decodeURIComponent(uriParts.pop());

	var result = self.getPlaylist(key)
		.then( function (playlist) {
			var items = [];
			if (playlist.Metadata !== undefined) {
				playlist.Metadata.forEach(function (song) {
					items.push(self._formatSong(song));
				});
			}
			defer.resolve(self._formatPlay(playlist.title, playlist.title, self._getPlaylistCover(playlist, curUri), new Date().toLocaleDateString(), playlist.duration, items, self._prevUri(curUri), curUri));
		})
		.fail(function(result) {
			defer.reject(new Error('playlistEntrys'));
		});
	return defer.promise;
}


ControllerPlexAmp.prototype.listArtists = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	// Call Play to get a list of playlists
	self.getAllArtists()
		.then(function (artists) {
			var items = [];

			for (const artist of artists) {
				items.push(self._formatArtist(artist, curUri));
			}
			defer.resolve(self._formatNav('All Artists', 'folder', self._getIcon(uriParts[1]), ['list', 'grid'], items, self._prevUri(curUri)));
		})
		.fail(function(error) {
			var conErr = {
				title: self.commandRouter.getI18nString('CON_FAILED'),
				message: self.commandRouter.getI18nString('CON_SERVER_UNREACHABLE'),
				size: 'lg',
				buttons: [{
					name: 'Ok',
					class: 'btn btn-warning'
				}]
			}
			self.commandRouter.broadcastMessage("openModal", conErr);
		});

	return defer.promise;
}

ControllerPlexAmp.prototype.showArtist = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();
	var title;

	var key = decodeURIComponent(uriParts.pop());

	var result = self.getAlbumsByArtist(key)
		.then( function(albums) {
			var items = [];
			if (albums.Metadata !== undefined) {
				albums.Metadata.forEach(function (song) {
					items.push(self._formatAlbum(song, curUri));
				});
			}
			defer.resolve(self._formatPlay(album.title, album.parentTitle, self.getAlbumArt(key), new Date().toLocaleDateString(), album.duration, items, self._prevUri(curUri), curUri));
		})
		.fail(function(result) {
			defer.reject(new Error('playlistEntrys'));
		});
	return defer.promise;
}

ControllerPlexAmp.prototype.handleBrowseUri = function (curUri) {
    var self = this;

	self.commandRouter.logger.info(curUri);
    var response;

	var uriParts = curUri.split('/');
	var defer = libQ.defer();

	self.isConnected()
		.then( function (ping) {
			if (curUri === 'plexamp') {	// Root URL
				response = self.rootMenu();
			} else if (curUri.startsWith('plexamp/newest')) {
				if (curUri === 'plexamp/newest') {
					response = self.listNewestAlbums(uriParts, curUri);
				} else {
					response = self.listTracks(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/played')) {
				if (curUri === 'plexamp/played') {
					response = self.listPlayedAlbums(uriParts, curUri);
				} else {
					response = self.listTracks(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/artists')) {
				if (uriParts.length === 2) {
					response = self.listArtists(uriParts, curUri);
				} else if (uriParts.length === 3) {
					response = self.showArtist(uriParts, curUri);
				} else if (uriParts.length === 4) {
					response = self.listTracks(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/playlists')) {
				if (curUri === 'plexamp/playlists')
					response = self.listPlaylists(uriParts, curUri);
				else if (uriParts.length === 3) {
					response = self.playlistEntrys(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/albums')) {
				if (curUri === 'plexamp/albums')
					response = self.listAllAlbums(uriParts, curUri);
				else if (uriParts.length === 3) {
					response = self.listTracks(uriParts, curUri);
				}
			}
			defer.resolve(response);
		})
		.fail(function(error) {
			self.commandRouter.logger.info("PlexAmp: " + error);
			var conErr = {
				title: self.commandRouter.getI18nString('CON_FAILED'),
				message: self.commandRouter.getI18nString('CON_SERVER_UNREACHABLE'),
				size: 'lg',
				buttons: [{
					name: 'Ok',
					class: 'btn btn-warning'
				}]
			}
			self.commandRouter.broadcastMessage("openModal", conErr);
		});

	return defer.promise;
}



// Define a method to clear, add, and play an array of tracks
ControllerPlexAmp.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	var plexCallback = function() {
		self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp: MPD player state update');
		self.mpdPlugin.getState()
			.then(function(state) {
				var selectedTrackBlock = self.commandRouter.stateMachine.getTrack(self.commandRouter.stateMachine.currentPosition);
				if (selectedTrackBlock.service && selectedTrackBlock.service == 'plexamp') {
					self.mpdPlugin.clientMpd.once('system-player', plexCallback);
					return self.pushState(state);
				} else {
					self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerVolusonic: Not a subsonic track, removing listener');
				}
			});
	};

	return self.mpdPlugin.sendMpdCommand('stop', [])
		.then(function() {
			return self.mpdPlugin.sendMpdCommand('clear', []);
		})
		.then(function() {
			return self.mpdPlugin.sendMpdCommand('load "' + track.uri + '"', []);
		})
		.fail(function(e) {
			return self.mpdPlugin.sendMpdCommand('add "' + track.uri + '"', []);
		})
		.then(function() {
			self.mpdPlugin.clientMpd.removeAllListeners('system-player');
			self.mpdPlugin.clientMpd.once('system-player', plexCallback);

			return self.mpdPlugin.sendMpdCommand('play', [])
				.then(function() {
					return self.mpdPlugin.getState()
						.then(function(state) {
							return self.pushState(state);
						});
				});
		});

};

ControllerPlexAmp.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::seek to ' + timepos);

	return self.mpdPlugin.seek(timepos);
};

// Stop
ControllerPlexAmp.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::stop');
	return self.mpdPlugin.stop()
		.then(function() {
			return self.mpdPlugin.getState()
				.then(function(state) {
					return self.pushState(state);
				});
		});
};

// Pause
ControllerPlexAmp.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::pause');


	return self.mpdPlugin.pause()
		.then(function() {
			return self.mpdPlugin.getState()
				.then(function(state) {
					return self.pushState(state);
				});
		});
};


// Resume
ControllerPlexAmp.prototype.resume = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::resume');
	return self.mpdPlugin.resume()
		.then(function() {
			return self.mpdPlugin.getState()
				.then(function(state) {
					return self.pushState(state);
				});
		});
}

// Next
ControllerPlexAmp.prototype.next = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::next');
	return self.mpdPlugin.sendMpdCommand('next', [])
		.then(function() {
			return self.mpdPlugin.getState()
				.then(function(state) {
					return self.pushState(state);
				});
		});
}

// Previous
ControllerPlexAmp.prototype.previous = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::previous');
	return self.mpdPlugin.sendMpdCommand('previous', [])
		.then(function() {
			return self.mpdPlugin.getState()
				.then(function(state) {
					return self.pushState(state);
				});
		});
}

// prefetch for gapless Playback
ControllerPlexAmp.prototype.prefetch = function(nextTrack) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::prefetch');

	return self.mpdPlugin.sendMpdCommand('add "' + nextTrack.uri + '"', [])
		.then(function() {
			return self.mpdPlugin.sendMpdCommand('consume 1', []);
		});
}

// Get state
ControllerPlexAmp.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::getState');


};

//Parse state
ControllerPlexAmp.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
ControllerPlexAmp.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerPlexAmp::pushState');

	return self.commandRouter.servicePushState(state, 'plexamp');
};

ControllerPlexAmp.prototype._getPlayable = function(song) {
	var self = this;

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
		albumart: self.getAlbumArt(song.parentThumb),
		uri: self.getStreamURL(song.Media[0].Part[0].key),
		samplerate: song.Media[0].bitrate + " kbps",
		trackType: song.Media[0].audioCodec,
		streaming: true
	}

	return track;
}


ControllerPlexAmp.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI
	var uriParts = uri.split('/');
	var key =  decodeURIComponent(uriParts.pop());
	var command;
	var params;
	var items = [];
	var song;

	if (!uri.startsWith('plexamp/track')) {
		self.commandRouter.logger.info("PlexAmp:: URI???:" + uri);

		self.getTrack(key).then(function (media) {
			if (media.Metadata === undefined) {
				defer.reject(new Error("Unable to get Track details: " + key));
			} else {
				var playable = self._getPlayable(media.Metadata[0]);
				defer.resolve(playable);
			}
		})
			.fail(function (result) {
				defer.reject(new Error('explodeUri plexamp/track'));
			});
	} else {
		self.getTrack(key).then(function(media) {
			if (media.Metadata === undefined) {
				defer.reject(new Error("Unable to get Track details: " + key));
			} else {
				var playable = self._getPlayable(media.Metadata[0]);
				defer.resolve(playable);
			}
		})
			.fail(function (result) {
				defer.reject(new Error('explodeUri plexamp/track'));
			});
	}

	return defer.promise;
};

ControllerPlexAmp.prototype.getURLPrefix = function() {
	var self = this;
	return self.config.get('server');	// Local server so http
}

ControllerPlexAmp.prototype.addPlexToken = function() {
	var self = this;
	return 'X-Plex-Token=' + self.config.get('token')
}

ControllerPlexAmp.prototype.getAlbumArt = function (key) {
	var self = this;

	var url = self.getURLPrefix() + key + "?" + self.addPlexToken();

	return url;
};

ControllerPlexAmp.prototype.getStreamURL = function(key) {
	var self = this;

	var url = self.getURLPrefix() + key + "?" + self.addPlexToken();

	return url;
}

/*
 * Search capabiltiry - TODO: investigate calling Plex Search
 */
ControllerPlexAmp.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

ControllerPlexAmp.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

	// Handle go to artist and go to album function
     return defer.promise;
};