'use strict';

var libQ = require('kew');
const fs = require("fs");
const path = require("path");
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

// Some plex libraries and modules
var plex = require('./plex');
const PlexPin = require('./plexpinauth');
const PlexCloud = require("./plexcloud");


module.exports = ControllerPlexAmp;
function ControllerPlexAmp(context) {
	var self = this;

	self.context = context;
	self.commandRouter = this.context.coreCommand;
	self.logger = this.context.logger;
	self.configManager = this.context.configManager;

	self.plexCloudOptions = {
		identifier: '983-ADC-213-BGF-132',	// Some unique ID
		product: 'Volumio-PlexAmp',	// Some suitable name for this plugin when it appears in Plex
		version: '1.0',
		deviceName: 'RaspberryPi',	// Maybe query the device Id eventually
		platform: 'Volumio'
	};
}

/**
 * Standard volumio event handlers
 */

ControllerPlexAmp.prototype.onVolumioStart = function() {
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	self.config = new (require('v-conf'))();
	self.config.loadFile(configFile);

	return libQ.resolve();
}

ControllerPlexAmp.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();

	self.plex = new plex(self.commandRouter.logger, self.config);

	self.mpdPlugin = self.commandRouter.pluginManager.getPlugin('music_service', 'mpd');

	self.commandRouter.loadI18nStrings();
	self.commandRouter.updateBrowseSourcesLang();

	// If we have a token we should be able to connect to the server
	self.plex.connect()
		.then(function(){
			self.commandRouter.logger.info("PlexAmp::Plex initialised" + self.plex);

			// If we can connect it's time to add the browsable links to Volumio
			self.addToBrowseSources();
		})
		.fail(function(error){
			self.logger.info("PlexAmp::Plex failed to connect");
			defer.reject(error);
		});

    return defer.promise;
};

ControllerPlexAmp.prototype.setMusicServerKey = function() {
	var self = this;
	var defer=libQ.defer();
	// But for some of these we actually need the root 'key' from the selected music library
	// So query all the music libraries and find the matching one based on the title
	self.plex.queryAllMusicLibraries().then(function (libraries) {

		// This should have been saved or automatically picked when we paired our alexa account
		var libraryName = self.config.get('library');
		var hostName = self.config.get('server');
		var port = self.config.get('port') | 32400;

		var filteredMusicLibrary = libraries.filter((library) => library.libraryTitle === libraryName && library.port === port && library.hostname === hostName );
		// If something is different - change the library and the key values stored in the config
		if (filteredMusicLibrary.length === 0) {
			self.logger.info("PlexAmp: Unable to find music library named: " + libraryName + " falling back to default");
			// OK just default to the first music library found
			if (libraries.length > 0) {
				self.config.set("library", filteredMusicLibrary[0].libraryTitle);
				self.config.set("key", filteredMusicLibrary[0].key);
				self.config.save();
			}
		}
		// Once the Plex is connected we successfully started so resolve the promise
		defer.resolve();
	}).fail(function(error) {
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

ControllerPlexAmp.prototype.getPlexCloudServers = function(token) {
	var defer = libQ.defer();
	var self = this;

	var plexcloud = PlexCloud(self.plexCloudOptions);
	plexcloud.getServers(token, function(servers) {
		defer.resolve(servers.MediaContainer.Server);
	}, function(error) {
		defer.reject(error);
	});

	return defer.promise;
}
// PIN Configuration Methods -----------------------------------------------------------------------------

/**
 * This method will get a Pin from Plex and then show this to the user
 * and wait for the user to enter it - assuming they do we get a token which we immediately
 * save and then we can at least get connect.
 *
 * @param data
 * @returns {Promise}
 */
ControllerPlexAmp.prototype.getPinAndUpdateField = function(data) {
	var defer = libQ.defer();
	var self = this;

	var lang_code = self.commandRouter.sharedVars.get('language_code');

	self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
		__dirname+'/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then(function(uiconf) {

			/*
			var sysversionf = self.commandRouter.executeOnPlugin('system_controller', 'system', 'getSystemVersion', '')
			sysversionf.then(function(info) {
				try {
					self.logger.info("PlexAmp:: System Info" + JSON.stringify(info));
				} catch (e) {
					self.logger.info("unable to query system information")
				}
			});
			{"systemversion":"3.378","builddate":"Fri 30 Sep 2022 10:43:40 AM CEST","variant":"volumio","hardware":"pi"}
			 */

			self.plexPin = new PlexPin(self.plexCloudOptions);

			self.plexPin.getPin().then(function(pin) {
				// This should enable the Link Plex Button - but first get a PIN to display

				let heading = self.commandRouter.getI18nString('PLEX_PIN_PREFIX');
				let message = self.commandRouter.getI18nString('PLEX_PIN_DETAILS');
				let modalData = {
					title: heading + pin.code,
					message: message,
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

				// get token
				let ping = setTimeout(function pollToken() {
					self.plexPin.getToken(pin.id)
						.then(res => {
							// success getting token
							if (res.token === true) {
								var token = res['auth-token'];
								self.config.set('token', token);
								self.config.save();


								// OK now we have a token - let query the plex cloud for a local server
								// Only because old Node JS Plex API library needs a server before it will work -
								// So we are using our own Plex Cloud library to query the list of servers and pick the first one
								self.getPlexCloudServers(token).then(function (servers) {
									// Lets default to the first server
									var serverDetails = servers[0].$;
									self.config.set('server', serverDetails.localAddresses);
									self.config.set('serverName', serverDetails.name);
									self.config.set('port', serverDetails.port);
									self.config.save();

									self.plex.connect().then(function(){

										self.addToBrowseSources();

										self.setMusicServerKey().then(function() {

											self.refreshUIConfig();
											defer.resolve(uiconf);

										}).fail(function(error){
											self.logger.info("PlexAmp::Plex failed to get a Music server key");
											defer.reject(error);
										});
									})
										.fail(function(error){
											self.logger.info("PlexAmp::Plex failed to connect");
											defer.reject(error);
										});
								});

							}// failed getting token
							else if (res.token === false) {
								self.logger.info('PlexAmp: Timeout! no Token');
								defer.reject("PlexAmp - Timeouted out waiting for token");
							}
							else {
								ping = setTimeout(pollToken, 1000);
							}
						})
						.catch(function(err) {
							self.logger.error(err.message)
							defer.reject("PlexAmp: Error" + err);
						});

				}, 2000);
			}).catch(function(err) {
				self.logger.error(err.message)
				defer.reject("PlexAmp: Error" + error);
			});

		})
		.fail(function(error) {
			self.logger.info(error);
			defer.reject(error);
		});

	return defer.promise;
};

ControllerPlexAmp.prototype.getIP = function () {
	const self = this;
	var address
	var iPAddresses = self.commandRouter.executeOnPlugin('system_controller', 'network', 'getCachedIPAddresses', '');
	if (iPAddresses && iPAddresses.eth0 && iPAddresses.eth0 != '') {
		address = iPAddresses.eth0;
	} else if (iPAddresses && iPAddresses.wlan0 && iPAddresses.wlan0 != '' && iPAddresses.wlan0 !== '192.168.211.1') {
		address = iPAddresses.wlan0;
	} else {
		address = '127.0.0.1';
	}

	return address;
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

			try {

				// If we have a token already - we can query and present a list of servers to configure

				var token = self.config.get('token');	// Let assume for now if we have a token it valid
				if (token && token.length > 0) {

					uiconf.sections[0].content[0].value = true;	// Connected !!

					// We should also have a previously configured server and music library entry
					var hostname = self.config.get('server');
					var libraryName = self.config.get('library');
					var port = self.config.get('port') | 32400;

					self.plex.queryAllMusicLibraries().then(function (libraries) {

						uiconf.sections[1].content[0].hidden = false;
						//uiconf.sections[1].content[1].hidden = false;	// Remote access coming soon
						uiconf.sections[1].content[2].hidden = false;
						uiconf.sections[1].content[3].hidden = false;

						var urlToUse = "http://" + self.getIP() + ":32400/web/index.html";
						uiconf.sections[2].content[2].onClick.url = urlToUse;

						for (const musicLibrary of libraries) {
							uiconf.sections[1].content[0].options.push({
								value:musicLibrary,
								label:musicLibrary.libraryTitle + " on " + musicLibrary.name
							});
						}

						var selectedLibrary = libraries.filter((filteredLibrary) => filteredLibrary.hostname === hostname && filteredLibrary.port === port && filteredLibrary.libraryTitle === libraryName);
						if (selectedLibrary.length === 0) {	// None found - lets use the first one !!
							selectedLibrary = libraries[0];
						} else {
							selectedLibrary = selectedLibrary[0];	// Just use the frst one filtered out
						}

						uiconf.sections[1].content[0].value.value = selectedLibrary;
						uiconf.sections[1].content[0].value.label = selectedLibrary.libraryTitle + " on " + selectedLibrary.name;

						uiconf.sections[1].content[4].value = findOption(self.config.get('timeOut'), uiconf.sections[1].content[4].options);
						uiconf.sections[1].content[4].hidden = false;

						defer.resolve(uiconf);
					}).fail(function(error) {
						self.logger.info(error);
						defer.reject(error);
					});
				} else {	// So if we are not connected show status
					uiconf.sections[0].content[0].value = false;	// Not connected !!
					defer.resolve(uiconf);
				}
			} catch(e) {
				self.logger.info.log(e);
			}
        })
        .fail(function(error) {
			self.logger.info(error);
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

ControllerPlexAmp.prototype.savePluginOptions = function(data) {
	var self = this;
	var defer = libQ.defer();

	self.config.set('timeOut', data['timeOut'].value);
	// Save the values from the library selected
	var previousServer = self.config.get('server');
	var newServer = data['library'].value.hostname;
	self.config.set('server', newServer);
	self.config.set('serverName', data['library'].value.name);
	self.config.set('port', data['library'].value.port);
	self.config.set('library', data['library'].value.libraryTitle);
	self.config.set("key", data['library'].value.key);
	self.config.set("local", data['local'].value);
	self.config.set("recentAddedLimit", data['recentAddedLimit'].value);
	self.config.set("recentPlayedLimit", data['recentPlayedLimit'].value);

	self.plex.cacheReset();	// Reset the cache as we might have had a different library cached

	self.config.save();
	self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('PLEXAMP_OPTIONS'), self.commandRouter.getI18nString('SAVED') + " !");

	//clearing mpd playlist due to seeking depending on transcoding setting
	self.resetPlugin();

	// If we have changed servers we have to get Plex to connect again
	if (newServer !== previousServer) {
		self.plex.connect().then(function() {
			defer.resolve();
		});
	} else {
		defer.resolve();
	}

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
		title: playlist.title + ' (' + playlist.leafCount + ')',
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
		duration: song.duration / 1000,
		album: song.summary,
		artist: song.grandparentTitle,	// Parent of track is the album and grandparent is the artist
		albumart: self.getAlbumArt(song.parentThumb),
		uri: 'plexamp/track/' + encodeURIComponent( song.ratingKey ),
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
		album: "",
		albumart: self.getAlbumArt(album.thumb),
		icon: "",
		uri: curUri + '/' + encodeURIComponent(album.ratingKey)
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
		uri: curUri + '/' + encodeURIComponent(artist.ratingKey)
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
				album: album,
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

ControllerPlexAmp.prototype.listPlaylists = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	const musicSectionKey = self.config.get('key');
	// Call Play to get a list of playlists
	self.plex.getListOfPlaylists(musicSectionKey)
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

	var limit = self.config.get("recentAddedLimit") || 100;

	// Get list of all the newest albums
	const musicSectionKey = self.config.get('key');
	self.plex.getListOfRecentAddedAlbums(musicSectionKey, limit)
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

	var limit = self.config.get("recentPlayedLimit") || 100;

	// Get list of all the newest albums
	const musicSectionKey = self.config.get('key');
	self.plex.getListOfRecentPlayedAlbums(musicSectionKey, limit)
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


ControllerPlexAmp.prototype.listNewestArtists = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	var limit = self.config.get("recentAddedLimit") || 100;

	self.logger.info("PlexAmp: In ListNewestArtists");

	// Get list of all the newest albums
	const musicSectionKey = self.config.get('key');
	self.plex.getListOfRecentAddedArtists(musicSectionKey, limit)
		.then(function(artists) {
			var items = [];

			for (const artist of artists) {
				items.push(self._formatArtist(artist, curUri));
			}
			defer.resolve(self._formatNav('Recently Added Artists', 'folder', self._getIcon(uriParts[1]), ['list', 'grid'], items, self._prevUri(curUri)));
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

ControllerPlexAmp.prototype.listPlayedArtists = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	var limit = self.config.get("recentPlayedLimit") || 100;

	// Get list of all the newest albums
	const musicSectionKey = self.config.get('key');
	self.plex.getListOfRecentPlayedArtists(musicSectionKey, limit)
		.then(function(artists) {
			var items = [];

			for (const artist of artists) {
				items.push(self._formatArtist(artist, curUri));
			}
			defer.resolve(self._formatNav('Recently Played Artists', 'folder', self._getIcon(uriParts[1]), ['list', 'grid'], items, self._prevUri(curUri)));
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

ControllerPlexAmp.prototype.listAllArtists = function(uriParts, curUri) {
	var self = this;

	var defer = libQ.defer();

	// Get list of all the artists sorted by title
	const musicSectionKey = self.config.get('key');
	self.plex.getAllArtists(musicSectionKey)
		.then(function(artists) {
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
				title: "Plex Server: " + self.config.get('serverName'),
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
						title: self.commandRouter.getI18nString('NEWEST_ARTISTS'),
						artist: '',
						album: '',
						icon: 'fa fa-microphone',
						uri: 'plexamp/artistsnewest'
					},
					{
						service: 'plexamp',
						type: 'item-no-menu',
						title: self.commandRouter.getI18nString('PLAYED_ARTISTS'),
						artist: '',
						album: '',
						icon: 'fa fa-microphone',
						uri: 'plexamp/artistsplayed'
					},
					{
						service: 'plexamp',
						type: 'item-no-menu',
						title: self.commandRouter.getI18nString('ARTISTS'),
						artist: '',
						album: '',
						icon: 'fa fa-microphone',
						uri: 'plexamp/artists'
					}

				]
			}]
		}
	});
	return libQ.resolve(nav);
}



ControllerPlexAmp.prototype.listTracks = function(uriParts, curUri) {
	var self = this;
	var defer = libQ.defer();
	var title;

	var key = decodeURIComponent(uriParts.pop());

	var result = self.plex.getAlbumTracks(key)
		.then( function (tracks) {
			var items = [];
			tracks.forEach(function (song) {
				items.push(self._formatSong(song));
			});
			self.plex.getAlbum(key).then( function (album) {
				defer.resolve(self._formatPlay(album.title, album.parentTitle, self.getAlbumArt(album.thumb), album.year, 0, items, self._prevUri(curUri), curUri));
			});
		})
		.fail(function(result) {
			defer.reject(result);
		});
	return defer.promise;
}


ControllerPlexAmp.prototype.playlistEntrys = function(uriParts, curUri) {
	var self = this;
	var defer = libQ.defer();
	var title;

	var key = decodeURIComponent(uriParts.pop());

	const PLAYLIST_LIMIT = 2000;
	var result = self.plex.getPlaylist(key, 0, PLAYLIST_LIMIT)
		.then( function (playlist) {
			var items = [];
			playlist.forEach(function (song) {
				items.push(self._formatSong(song));
			});
			defer.resolve(self._formatPlay(playlist.title, playlist.title, self._getPlaylistCover(playlist, curUri), new Date().toLocaleDateString(), playlist.duration, items, self._prevUri(curUri), curUri));
		})
		.fail(function(result) {
			defer.reject(result);
		});
	return defer.promise;
}

ControllerPlexAmp.prototype.showArtist = function(uriParts, curUri) {
	var self = this;
	var defer = libQ.defer();
	var key = decodeURIComponent(uriParts.pop());	// Artist key !!


	var nav = {
		navigation: {
			lists: [],
			prev: {
				uri: self._prevUri(curUri)
			},
			info: {}
		}
	}

	var info = {
		uri: curUri,
		title: '',
		service: 'plexamp',
		type: 'artist',
		albumart: ''
	}

		// Get Bio of artists from Plex
	self.plex.getArtist(key).then( function(metadata) {
		if (!Array.isArray(metadata)) {
			self.logger.info("Artist details invalid" + key);
			defer.reject("Unable to get artist details");
			return ;
		}
		var artist = metadata[0];

		var artistArtURL = self.getAlbumArt(artist.thumb);

		//head section
		info.title = artist.title;
		info.albumart = artistArtURL;
		nav.navigation['info'] = info;

		var bio = {
			title: artist.summary,
			type: 'folder',
			availableListViews: ['list', 'grid'],
			items: [{
				service: 'plexamp',
				type: 'song',
				icon: 'fa fa-bolt',
				title: self.commandRouter.getI18nString('START_RADIO'),
				uri: 'plexamp/artistradio/' + key,
			}]
		}
		nav.navigation['lists'].push(bio);

		// Get Top Tracks from Plex
		if (artist.PopularLeaves && artist.PopularLeaves.size > 0) {
			var popularTracks = artist.PopularLeaves.Metadata;
			var sgs = [];
			popularTracks.forEach(function(song) {
				sgs.push(self._formatSong(song, curUri + "/" + encodeURIComponent(song.parentRatingKey)));	// Add album to URI
			});
			var topSongs = {
				title: self.commandRouter.getI18nString('TOP_SONGS'),
				type: 'song',
				availableListViews: ['list', 'grid'],
				items: sgs
			}
			nav.navigation['lists'].push(topSongs);
		}

		// Get Albums List from Plex
		self.plex.getAlbumsByArtist(key).then( function(albums) {
			var albs = [];
			albums.forEach(function (album) {
				albs.push(self._formatAlbum(album, curUri));
			});
			var albums = {
				title: self.commandRouter.getI18nString('ALBUMS'),
				type: 'folder',
				availableListViews: ['list', 'grid'],
				items: albs
			}
			nav.navigation['lists'].push(albums);

			// Finally get Related Artists from Plex

			// "hub.external.artist.similar.sonically"

			defer.resolve(nav);
		});
	})
	.fail(function(result) {
		defer.reject(result);
	});
	return defer.promise;
}

ControllerPlexAmp.prototype.showAlbum = function(uriParts, curUri) {
	var self = this;
	var defer = libQ.defer();
	var key = decodeURIComponent(uriParts.pop());	// Album key !!


	var nav = {
		navigation: {
			lists: [],
			prev: {
				uri: self._prevUri(curUri)
			},
			info: {}
		}
	}

	var info = {
		uri: curUri,
		title: '',
		service: 'plexamp',
		type: 'album',
		albumart: ''
	}

	// Get metdata of album from Plex
	self.plex.getAlbum(key).then( function(metadata) {
		if (!Array.isArray(metadata)) {
			self.logger.info("Invalid album details?" + key);
			defer.reject("Unable to get album details");
		}

		var album = metadata[0];

		var albumArtURL = self.getAlbumArt(album.thumb);

		//head section
		info.title = album.title;
		info.albumart = albumArtURL;
		nav.navigation['info'] = info;

		var bio = {
			title: album.summary,
			type: 'folder',
			availableListViews: ['list', 'grid'],
			items: [{
				service: 'plexamp',
				type: 'song',
				icon: 'fa fa-bolt',
				title: self.commandRouter.getI18nString('START_RADIO'),
				uri: 'plexamp/albumradio/' + key,
			}]
		}
		nav.navigation['lists'].push(bio);

		// Get Tracks from Plex
		self.plex.getAlbumTracks(key).then( function(tracks) {
			var sgs = [];
			for (const song of tracks) {
				sgs.push(self._formatSong(song, curUri + "/" + encodeURIComponent(song.parentRatingKey)));	// Add album to URI
			}
			var songs = {
				title: self.commandRouter.getI18nString('TRACKS'),
				type: 'song',
				availableListViews: ['list', 'grid'],
				items: sgs
			}
			nav.navigation['lists'].push(songs);

			// Get Similar Albums List from Plex
			self.plex.getAlbumRelated(key).then( function(albumsRelated) {
				var albs = [];
				var similarAlbums = self.filterMetadataFromHub(albumsRelated.Hub, "hub.external.album.similar.sonically");
				similarAlbums.forEach(function (album) {
					albs.push(self._formatAlbum(album, "plexamp/artistsnewest/" + album.parentRatingKey ));
				});
				var albums = {
					title: self.commandRouter.getI18nString('SIMILAR_ALBUMS'),
					type: 'folder',
					availableListViews: ['list', 'grid'],
					items: albs
				}
				nav.navigation['lists'].push(albums);

				defer.resolve(nav);
			});
		});
	})
		.fail(function(result) {
			defer.reject(result);
		});
	return defer.promise;
}

ControllerPlexAmp.prototype.filterMetadataFromHub = function(hubs, context) {
	for (const hub of hubs ) {
		if (hub.context === context) {
			return hub.Metadata;
		}
	}
	return [];
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
					response = self.showAlbum(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/played')) {
				if (curUri === 'plexamp/played') {
					response = self.listPlayedAlbums(uriParts, curUri);
				} else {
					response = self.showAlbum(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/artistsnewest')) {
				if (curUri === 'plexamp/artistsnewest') {
					response = self.listNewestArtists(uriParts, curUri);
				} else if (uriParts.length === 3) {
					response = self.showArtist(uriParts, curUri);
				} else if (uriParts.length === 4) {
					response = self.showAlbum(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/artistsplayed')) {
				if (curUri === 'plexamp/artistsplayed') {
					response = self.listPlayedArtists(uriParts, curUri);
				} else if (uriParts.length === 3) {
					response = self.showArtist(uriParts, curUri);
				} else if (uriParts.length === 4) {
					response = self.showAlbum(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/playlists')) {
				if (curUri === 'plexamp/playlists')
					response = self.listPlaylists(uriParts, curUri);
				else if (uriParts.length === 3) {
					response = self.playlistEntrys(uriParts, curUri);
				}
			} else if (curUri.startsWith('plexamp/artists')) {
				if (curUri === 'plexamp/artists') {
					response = self.listAllArtists(uriParts, curUri);
				} else if (uriParts.length === 3) {
					response = self.showArtist(uriParts, curUri);
				} else if (uriParts.length === 4) {
					response = self.showAlbum(uriParts, curUri);
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
	var self = this;
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
		duration: song.duration / 1000,
		artist: song.grandparentTitle,
		artistId: song.grandparentRatingKey,
		album: song.parentTitle,
		albumId: song.parentRatingKey,
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

	// Pattern that matches play an album !!
	if (uri.startsWith('plexamp/album') || uri.startsWith("plexamp/newest") || uri.startsWith("plexamp/played")) {

		// We are adding a list of tracks from an album
		self.plex.getAlbumTracks(key).then(function (tracks) {
			if (tracks === undefined) {
				defer.reject(new Error("Unable to get Track details: " + key));
			} else {
				var playable = [];
				for (const media of tracks) {
					playable.push(self._getPlayable(media));
				}
				defer.resolve(playable);
			}
		})
			.fail(function (result) {
				defer.reject(new Error('explodeUri plexamp/track'));
			});
	} else if (uri.startsWith('plexamp/track')) {
		self.plex.getTrack(key).then(function(metadata) {
			if (!Array.isArray(metadata)) {
				defer.reject(new Error("Unable to get Track details: " + key));
			} else {	// Only the first element is the track !!
				var playable = self._getPlayable(metadata[0]);
				defer.resolve(playable);
			}
		})
			.fail(function (result) {
				defer.reject(new Error('explodeUri plexamp/track'));
			});
	} else if (uri.startsWith('plexamp/playlist')) {
		const PLAYLIST_LIMIT = 2000;
		self.plex.getPlaylist(key, 0, PLAYLIST_LIMIT).then(function(tracks) {
			if (tracks === undefined) {
				defer.reject(new Error("Unable to get Track details: " + key));
			} else {
				var playable = [];
				for (const media of tracks) {
					playable.push(self._getPlayable(media));
				}
				defer.resolve(playable);
			}
		})
			.fail(function (result) {
				defer.reject(result);
			});
	} else if (uri.startsWith('plexamp/artist')) {
		if (uriParts.length === 2) {
			self.plex.getAlbumsByArtist(key).then(function (albums) {
				var albumPromises = [];
				for (const album of albums) {
					albumPromises.push(self.plex.getAlbumTracks(album.ratingKey));
				}
				var playable = [];
				Promise.all(albumPromises).then(function (arrayAlbums) {
					self.logger.info(JSON.stringify(arrayAlbums));
					for (const albumTracks of arrayAlbums) {
						for (const media of albumTracks) {
							playable.push(self._getPlayable(media));
						}
					}
					defer.resolve(playable);
				});
			})
			.fail(function (result) {
				defer.reject(result);
			});
		} else if (uriParts.length === 3) {	// Just the single album from the artist!
			self.plex.getAlbumTracks(key).then(function (tracks) {
				if (tracks === undefined) {
					defer.reject(new Error("Unable to get Track details: " + key));
				} else {
					var playable = [];
					for (const media of tracks) {
						playable.push(self._getPlayable(media));
					}
					defer.resolve(playable);
				}
			})
				.fail(function (result) {
					defer.reject(result);
				});
		} else if (uriParts.length === 4) {	// Just the single track from the artist!
			self.plex.getTrack(key).then(function(metadata) {
				if (!Array.isArray(metadata)) {
					defer.reject(new Error("Unable to get Track details: " + key));
				} else {
					var playable = self._getPlayable(metadata[0]);
					defer.resolve(playable);
				}
			})
			.fail(function (result) {
				defer.reject(result);
			});
		}
	}
	else if (uri.startsWith('plexamp/radio')) {	// Lets query Plex for their artist radio !!
		if (uriParts.length === 2) {

		}

	} else {
		self.logger.info("PlexAmp: Cannot Exploded URI: " + uri);
	}

		return defer.promise;
};

ControllerPlexAmp.prototype.getURLPrefix = function() {
	var self = this;
	return "http://" + self.config.get('server') + ":" + self.config.get('port');	// Local server so http for now !!
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

	var answer = [];
	var limit = self.config.get("recentAddedLimit") || 100;
	const musicSectionKey = self.config.get('key');
	self.plex.searchForArtists(musicSectionKey, query.value, limit).then(function(artistsResults) {
		var artists = [];

		artistsResults.forEach(function (artist) {
			artists.push(self._formatArtist(artist, "plexamp/artist"));
		});

		answer.push({
			title: self.commandRouter.getI18nString('ARTISTS'),
			icon: 'fa fa-microphone',
			availableListViews: [
				"list",
				"grid"
			],
			items: artists
		});

		self.plex.searchForAlbums(musicSectionKey, query.value, limit).then(function(albumsResults) {
			var albums = [];

			albumsResults.forEach(function (album) {
				albums.push(self._formatAlbum(album, "plexamp/album"));
			});
			answer.push({
				title: self.commandRouter.getI18nString('ALBUMS'),
				icon: 'fa fa-play',
				availableListViews: [
					"list",
					"grid"
				],
				items: albums
			});

			self.plex.searchForTracks(musicSectionKey, query.value, limit).then(function(songResults) {
				var songs = [];

				songResults.forEach(function (song) {
					songs.push(self._formatSong(song, "plexamp/track"));
				});
				answer.push({
					title: self.commandRouter.getI18nString('TRACKS'),
					icon: 'fa fa-music',
					availableListViews: [
						"list",
						"grid"
					],
					items: songs
				});

				// Finally got all the results so resolve the search
				defer.resolve(answer);
			});
		});
	}).fail(function(error){
		self.logger.info(error);
		defer.reject(error);
	});

	return defer.promise;
};

ControllerPlexAmp.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer();

	var track = self.commandRouter.stateMachine.playQueue.getTrack(self.commandRouter.stateMachine.currentPosition);

	if (data.type == "artist") {
		defer.resolve(self.handleBrowseUri("plexamp/artists/" + track.artistId));
	} else {
		defer.resolve(self.handleBrowseUri("plexamp/artists/" + track.artistId + "/" + track.albumId));
	}
	return defer.promise;
};

ControllerPlexAmp.prototype.installPlexAmp = function (version) {
	const self = this;

	//----------- PlexAmp 4.4.0 script for now

	try {
/*		exec("/usr/bin/sudo /data/music_service/plexamp/installPlexAmp" + version +".sh", {
			uid: 1000,
			gid: 1000
		});
 */
		self.commandRouter.pushConsoleMessage('PlexAmp Installation coming soon');
		self.commandRouter.pushToastMessage('success', "Headless PlexAmp installation will soon be availalbe");

	} catch (err) {
		self.logger.info('failed to install PlexAmp' + err);
	}
}

ControllerPlexAmp.prototype.upgradePlexamp = function (version) {
	const self = this;

	self.logger.info('Attempt to upgrade PlexAmp');
}

ControllerPlexAmp.prototype.isPlexampInstalled = function () {
	const self = this;

	try {
		var result = execSync("/usr/bin/sudo /bin/systemctl status plexamp.service", {
			uid: 1000,
			gid: 1000
		});
		self.commandRouter.pushConsoleMessage('PlexAmp status? ' + result);
		return true;
	} catch (err) {
		self.logger.info('failed to get status of Plexamp service: ' + err);
	}

	return false;
}

ControllerPlexAmp.prototype.startPlexamp = function () {
	const self = this;
	let defer = libQ.defer();

	try {
		exec("/usr/bin/sudo /bin/systemctl start plexamp.service", {
			uid: 1000,
			gid: 1000
		});
		self.commandRouter.pushConsoleMessage('PlexAmp started');
		defer.resolve();
	} catch (err) {
		self.logger.info('failed to start Plexamp' + err);
	}

	return defer.promise;

}
ControllerPlexAmp.prototype.stopPlexamp = function () {
	const self = this;
	let defer = libQ.defer();

	try {
		exec("/usr/bin/sudo /bin/systemctl stop plexamp.service", {
			uid: 1000,
			gid: 1000
		});
		self.commandRouter.pushConsoleMessage('PlexAmp stopped');
		defer.resolve();
	} catch (err) {
		self.logger.info('failed to unload PlexAmp' + err);
	}
	return defer.promise;

}

