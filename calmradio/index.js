'use strict'
const unirest = require('unirest')
const libQ = require('kew')
const fs = require('fs-extra')
const NodeCache = require('node-cache')

const CRURLS = {
		categories: 'https://api.calmradio.com/categories.json',
		channels: 'https://api.calmradio.com/channels.json',
		arts: 'https://arts.calmradio.com',
		token: 'https://api.calmradio.com/get_token',
		check: 'https://api.calmradio.com/check'
	}

/**
 * CONSTRUCTOR
 */
module.exports = ControllerCalmRadio

function ControllerCalmRadio (context) {
	let self = this

	this.context = context
	this.commandRouter = this.context.coreCommand
	this.logger = this.context.logger
	this.configManager = this.context.configManager
	// cache categories/channels data for 1 week, check daily
	self.cache = new NodeCache({stdTTL: 604800, checkperiod: 86400})
}


ControllerCalmRadio.prototype.getConfigurationFiles = function () {
	let self = this

	return ['config.json']
}


ControllerCalmRadio.prototype.onVolumioStart = function () {
	let defer = libQ.defer()

	this.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd')
	let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json')
	this.config = new (require('v-conf'))()
	this.config.loadFile(configFile)

	defer.resolve('')

	return defer.promise
}


ControllerCalmRadio.prototype.onStart = function () {
	let defer = libQ.defer()

	this.loadI18n()
	this.startupLogin()

	defer.resolve('')

	return defer.promise
}


ControllerCalmRadio.prototype.loadI18n = function () {
	let self = this

	let language_code = this.commandRouter.sharedVars.get('language_code')
	fs.readJson(__dirname+'/i18n/strings_en.json', (err, defaulti18n) => {
		if (err) {} else {
			self.i18nStringsDefaults = defaulti18n
			fs.readJson(__dirname+'/i18n/strings_'+language_code+'.json', (err, langi18n) => {
				if (err) {
					self.i18nStrings = self.i18nStringsDefaults
				} else {
					self.i18nStrings = langi18n
				}
			})
		}
	})
}


ControllerCalmRadio.prototype.getI18n = function (key) {
	let self = this

	if (key.indexOf('.') > 0) {
		let mainKey = key.split('.')[0]
		let secKey = key.split('.')[1]
		if (self.i18nStrings[mainKey][secKey] !== undefined) {
			return self.i18nStrings[mainKey][secKey]
		} else {
			return self.i18nStringsDefaults[mainKey][secKey]
		}
	} else {
		if (self.i18nStrings[key] !== undefined) {
			return self.i18nStrings[key]
		} else {
			return self.i18nStringsDefaults[key]
		}
	}
}


ControllerCalmRadio.prototype.startupLogin = function () {
	let self = this

	self.addToBrowseSources()
	self.shallLogin()
		.then(() => self.loginToCalmRadio(this.config.get('username'), this.config.get('password'), false))
}


ControllerCalmRadio.prototype.shallLogin = function () {
	let self = this
	let defer = libQ.defer()

	if (this.config.get('loggedin',false) 
		&& this.config.get('username')
		&& this.config.get('username')!=''
		&& this.config.get('password')
		&& this.config.get('password')!='')
	{
		defer.resolve()
	} else {
		defer.reject()
	}
	
	return defer.promise
}


ControllerCalmRadio.prototype.loginToCalmRadio = function (username, password) {
	let defer = libQ.defer()
	let self = this

	self.logger.info('Log in to Calm Radio')

	unirest.get(CRURLS.token+'?user='+encodeURIComponent(username)+'&pass='+encodeURIComponent(password))
		.then((response) => {
			if (response && 
				response.status === 200 &&
				response.body &&
				'membership' in response.body &&
				response.body['membership'] == 'active')
			{
				self.userToken = response.body['token']
				self.config.set('username', username)
				self.config.set('password', password)
				self.config.set('token', response.body['token'])
				self.config.set('loggedin',true)
				defer.resolve()
			} else {
				defer.reject()
			}	
		})

	return defer.promise
}


ControllerCalmRadio.prototype.onStop = function () {
	let self = this
	let defer = libQ.defer()

	self.commandRouter.volumioRemoveToBrowseSources('calmradio')

	defer.resolve('')

	return defer.promise
}


ControllerCalmRadio.prototype.addToBrowseSources = function () {
	let self = this

	self.logger.info('Adding Calm Radio to Browse Sources')
	let data = {
		name: 'Calm Radio',
		uri: 'calmradio://',
		plugin_type: 'music_service',
		plugin_name: 'calmradio',
		albumart: '/albumart?sourceicon=music_service/calmradio/icons/calmradioicon.png'
	}
	return self.commandRouter.volumioAddToBrowseSources(data)
}


ControllerCalmRadio.prototype.getCalmRadioData = function (which) {
	let self = this
	let defer = libQ.defer()

	if (self.cache.has(which)) {
		defer.resolve(self.cache.get(which))
	} else {
		let wtxt = self.getI18n('CALMRADIO.'+which.toUpperCase())
		self.commandRouter.pushToastMessage('info', self.getI18n('CALMRADIO.UPDATING').replace('%',wtxt))
		self.logger.info('Getting Calm Radio '+which+' data')
		let request = unirest.get(CRURLS[which])
			.then(response => {
				if (response && response.status === 200) {
					self.cache.set(which, response.body)
					defer.resolve(response.body)
				} else {
					defer.reject()
				}
			})
	}

	return defer.promise
}


ControllerCalmRadio.prototype.getChannelFromUri = function (uri) {
	let self = this
	let defer = libQ.defer()

	let catId = uri.split('/')[2]
	let chanId = uri.split('/')[3]

	self.getCalmRadioData('channels')
		.then((chans) => {
			let found = false
			for (let cat of chans) {
				if (cat['category'] == catId) {
					for (let chan of cat['channels']) {
						if (chan['id'] == chanId) {
							found = true
							defer.resolve(chan)
							break
						}
					}
					break
				}
			}
			if (!found) defer.reject()
		})

	return defer.promise
}


ControllerCalmRadio.prototype.getGroupName = function (groupId) {
	let self = this
	let gnam = `- - ${groupId} - -`

	if (self.cache.has('categories')) {
		let cats = self.cache.get('categories')
		let found = false

		for (let top of cats) {
			for (let cat of top['categories']) {
				if (cat['id'] == groupId) {
					found = true
					gnam = cat['name']
					break
				}
			}
			if (found) break
		}
	}

	return gnam
}


ControllerCalmRadio.prototype.handleBrowseUri = function (curUri) {
	switch (curUri) {
		case 'calmradio://':
			return this.handleRootBrowseUri()

		default:
			return this.handleGroupBrowseUri(curUri)
	}
}


ControllerCalmRadio.prototype.doListCategories = function (bg) {
	let self = this
	let cats = self.cache.get('categories')
	let groupItems = []
	let catt = ''

	self.logger.info('Listing Calm Radio Categories '+bg)
	cats.map(group => {
		if (bg) {
			if (bg == group['id'] && group['categories']) {
				catt = group['name'].replace('CALMRADIO - ','')
				group['categories'].map(sgrp => {
					groupItems.push({
						type: 'item-no-menu',
						title: sgrp['name'].replace('CALMRADIO - ',''),
						albumart: CRURLS.arts + sgrp['image'],
						uri: `calmradio://${bg}/${sgrp['id']}`
					})
				})
			}
		} else {
			groupItems.push({
				type: 'item-no-menu',
				title: group['name'],
				albumart: '/albumart?sectionimage=music_service/calmradio/icons/'+group['name']+'.png',
				uri: `calmradio://${group['id']}`
			})
		}
	})

	let browseResponse = {
		navigation: {
			lists: [
				{
					type: 'title',
					title: 'Calm Radio ' + (bg ? (catt + ' ' + self.getI18n('CALMRADIO.GROUPS')) : self.getI18n('CALMRADIO.CATEGORIES')),
				//	'availableListViews': ['grid', 'list'],
					availableListViews: ['grid'],
					items: groupItems
				}]
		}
	}
	self.commandRouter.translateKeys(browseResponse, self.i18nStrings, self.i18nStringsDefaults)

	return browseResponse
}


ControllerCalmRadio.prototype.handleRootBrowseUri = function () {
	let defer = libQ.defer()
	let self = this

	self.logger.info('Calm Radio root browse')
	self.getCalmRadioData('categories')
		.then(() => {
			defer.resolve(this.doListCategories())
		})

	return defer.promise
}


ControllerCalmRadio.prototype.doListChannels = function (groupId, sterm=null) {
	let self = this
	self.logger.info('Calm Radio list channels for group '+groupId)
	let chans = self.cache.get('channels')

	let channelItems = []
	let catt = this.getGroupName(groupId) + ' '
	chans.map(cat => {
		if (cat['category'] == groupId) {
			cat['channels'].map(channel => {
				if (!sterm || sterm.test(channel.title) || sterm.test(channel.description)) {
					let chant = 'webradio'
					let chnid = channel['id']
					if (!self.isLoggedIn() && !channel.streams.free) {
						chant = 'item-no-menu'
						chnid = '-1'
					}
					channelItems.push({
						type: chant,
						title: channel['title'].replace('CALMRADIO - ',''),
						albumart: CRURLS.arts + channel['image'],
						uri: `calmradio://${groupId}/${chnid}`,
						service:'calmradio'
					})
				}
			})
		}
	})

	let browseResponse = {
		navigation: {
			lists: [
				{
					type: 'title',
					title: 'Calm Radio ' + catt + self.getI18n('CALMRADIO.CHANNELS'),
					availableListViews: ['grid', 'list'],
					items: channelItems
				}]
		}
	}
	self.commandRouter.translateKeys(browseResponse, self.i18nStrings, self.i18nStringsDefaults)

	return browseResponse
}


ControllerCalmRadio.prototype.handleGroupBrowseUri = function (curUri) {
	let defer = libQ.defer()
	let self = this

	self.logger.info('Calm Radio group browse '+curUri)
	let groupId = curUri.split('/')[2]
	let subgrId = curUri.split('/')[3]

	if (subgrId < 0) {
		self.commandRouter.pushToastMessage('error', self.getI18n('COMMON.LOGIN_FIRST'))
		defer.resolve({})
		return defer.promise
	} else if (subgrId > 0) {
		if (self.cache.has('channels')) {
			defer.resolve(this.doListChannels(subgrId))
			return defer.promise
		}
	} else {
		defer.resolve(this.doListCategories(groupId))
		return defer.promise
	}

	self.logger.info('Getting Calm Radio Channels for Group '+subgrId)
	self.getCalmRadioData('channels')
		.then(() => {
			defer.resolve(this.doListChannels(subgrId))
		})

	return defer.promise
}


ControllerCalmRadio.prototype.explodeUri = function (uri) {
	let self = this
	let defer = libQ.defer()

	let groupId = uri.split('/')[2]
	let channelId = uri.split('/')[3]
	self.logger.info('Calm Radio explodeUri for Cat ' + groupId + ' Chan ' + channelId)

	self.getChannelFromUri(uri)
		.then((chan) => {
			defer.resolve({
				uri: uri,
				service: 'calmradio',
				name: chan['title'],
				albumart: CRURLS.arts + chan['image'],
				type: 'webradio'
			})
		})

	return defer.promise
}


ControllerCalmRadio.prototype.getStreamUrl = function (curUri) {
	let defer = libQ.defer()
	let self = this

	let rate, cred
	let groupId = curUri.split('/')[2]
	let channelId = curUri.split('/')[3]
	self.logger.info('Calm Radio getStreamUrl for Cat ' + groupId + ' Chan ' + channelId)

	if (self.isLoggedIn()) {
		rate = self.config.get('bitrate', '64')
		cred = self.config.get('username') + ':' + self.config.get('token')+'@'
	} else {
		rate = 'free'
		cred = ''
	}
	let explodeResp = {uri: ''}

	self.getChannelFromUri(curUri)
		.then((chan) => {
			let cred = self.config.get('username') + ':' + self.config.get('token')+'@'
			explodeResp.uri = chan.streams[rate].replace('://','://'+cred)
			defer.resolve(explodeResp)
		})

	return defer.promise
}


ControllerCalmRadio.prototype.clearAddPlayTrack = function (track) {
	let self = this
	let defer = libQ.defer()

	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::clearAddPlayTrack')


	self.getStreamUrl(track.uri)
		.then((track) => {
			return self.mpdPlugin.sendMpdCommand('stop',[])
				.then(function() {
					return self.mpdPlugin.sendMpdCommand('clear',[])
				})
				.then(function(stream) {
					return self.mpdPlugin.sendMpdCommand('load "'+track.uri+'"',[])
				})
				.fail(function (e) {
					return self.mpdPlugin.sendMpdCommand('add "'+track.uri+'"',[])
				})
				.then(function() {
					self.commandRouter.stateMachine.setConsumeUpdateService('mpd')
					return self.mpdPlugin.sendMpdCommand('play',[])
				})
				.fail(function (e) {
					self.logger.error('Could not Clear and Play Calm Radio Track: ' + e)
					defer.reject(new Error())
				})
		})
		.fail((e) => {
			self.logger.error('Could not get Calm Radio Stream URL: ' + e)
			defer.reject(new Error())
		})

	return defer
}


ControllerCalmRadio.prototype.clearAddPlayTracks = function (track) {
	let self = this
	let defer = libQ.defer()

	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::clearAddPlayTracks')

	defer.resolve()
	return defer.promise
}



ControllerCalmRadio.prototype.stop = function () {
	let self = this
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::stop')

	return self.mpdPlugin.sendMpdCommand('stop', [])
}


ControllerCalmRadio.prototype.search = function (text) {
	let self = this
	let defer = libQ.defer()

	self.getCalmRadioData('channels')
		.then((chans) => {
			let chlst = []
			let rgx = new RegExp(text.value, 'i')
			chans.map(cat => {
				chlst = chlst.concat(self.doListChannels(cat['category'], rgx).navigation.lists[0].items)
			})
			defer.resolve([{
				title: 'Calm Radio',
				icon: 'fa-heartbeat',
				availableListViews: ['list'],
				items: chlst
			}])
		})

	return defer.promise
}


ControllerCalmRadio.prototype.getUIConfig = function () {
	let self = this
	let defer = libQ.defer()

	let lang_code = this.commandRouter.sharedVars.get('language_code')
	self.commandRouter.i18nJson(
		__dirname + '/i18n/strings_'+lang_code+'.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then((uiconf) => {
			if (self.isLoggedIn()) {
				uiconf.sections[0].content[0].hidden = true
				uiconf.sections[0].content[1].hidden = true
				uiconf.sections[0].content[2].hidden = true

				uiconf.sections[0].description = self.getI18n('CONFIG.LOGGED_IN_EMAIL')+self.config.get('username')
				uiconf.sections[0].saveButton.label = self.getI18n('CONFIG.LOGOUT')
				uiconf.sections[0].onSave.method = 'clearAccountCredentials'
			} else {
				uiconf.sections[0].content[0].hidden = false
				uiconf.sections[0].content[1].hidden = false
				uiconf.sections[0].content[2].hidden = false

				uiconf.sections[1].hidden = true

				uiconf.sections[0].description = self.getI18n('CONFIG.ACCOUNT_LOGIN_DESC')
				uiconf.sections[0].saveButton.label = self.getI18n('CONFIG.LOGIN')
				uiconf.sections[0].onSave.method = 'saveAccountCredentials'
			}

			let bro = {'64':0,'192':1,'320':2}
			uiconf.sections[1].content[0].value = uiconf.sections[1].content[0].options[bro[this.config.get('bitrate')]]

			defer.resolve(uiconf)
		})
		.fail((e) => {
			self.logger.error('Could not fetch CALMRADIO UI Configuration: ' + e)
			defer.reject(new Error())
		})

	return defer.promise
}


ControllerCalmRadio.prototype.savePlaybackSettings = function (settings) {
	let self = this
	let defer = libQ.defer()

	this.config.set('bitrate', settings['calmradio_bitrate']['value'])
	defer.resolve({})

	return defer.promise
}


ControllerCalmRadio.prototype.saveAccountCredentials = function (settings) {
	let self = this
	let defer = libQ.defer()

	self.loginToCalmRadio(settings['calmradio_username'], settings['calmradio_password'], 'user')
		.then(() => {
			this.config.set('username', settings['calmradio_username'])
			this.config.set('password', settings['calmradio_password'])

			let config = self.getUIConfig()
			config.then(function(conf) {
				self.commandRouter.broadcastMessage('pushUiConfig', conf)
			})

			self.commandRouter.pushToastMessage('success', self.getI18n('COMMON.LOGGED_IN'))
			defer.resolve({})
		})
		.fail(() => {
			self.commandRouter.pushToastMessage('error', self.getI18n('COMMON.ERROR_LOGGING_IN'))
			defer.reject()
		})

	return defer.promise
}


ControllerCalmRadio.prototype.clearAccountCredentials = function (settings) {
	let self = this
	let defer = libQ.defer()

	self.logoutFromCalmRadio(settings['calmradio_username'], settings['calmradio_password'])
		.then(() => {
			let config = self.getUIConfig()
			config.then(function(conf) {
				self.commandRouter.broadcastMessage('pushUiConfig', conf)
			})

			self.commandRouter.pushToastMessage('success', self.getI18n('COMMON.LOGGED_OUT'))
			defer.resolve({})
		})
		.fail(() => {
			self.commandRouter.pushToastMessage('error', self.getI18n('COMMON.ERROR_LOGGING_OUT'))
			defer.reject()
		})

	return defer.promise
}


ControllerCalmRadio.prototype.logoutFromCalmRadio = function (username, password) {
	let defer = libQ.defer()
	let self = this

	unirest.get(CRURLS.check+'?user='+encodeURIComponent(username)+'&pass='+encodeURIComponent(password))
		.then((response) => {
			if (response && response.status == 200) {
				this.config.set('username', '')
				this.config.set('password', '')
				this.config.set('loggedin', false)

				defer.resolve()
			} else {
				defer.reject()
			}
		})

	return defer.promise
}


ControllerCalmRadio.prototype.isLoggedIn = function () {
	return this.config.get('loggedin', false)
}
