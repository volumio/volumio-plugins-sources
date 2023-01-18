/*jshint -W033*/
'use strict'
const unirest = require('unirest')
const libQ = require('kew')
const fs = require('fs-extra')
const NodeCache = require('node-cache')

const CRURLS = {
		metadata: 'https://api.calmradio.com/v2/metadata.json',
		categories: 'https://api.calmradio.com/v2/metadata.json',
		channels2: 'https://api.calmradio.com/v2/channels.json',
		channels: 'https://api.calmradio.com/v2/channels.json',
		arts: 'https://arts.calmradio.com',
		token: 'https://api.calmradio.com/get_token',
		check2: 'https://api.calmradio.com/v2/check',
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
				'membership' in response.body)
			{
				if (response.body['membership'] == 'active') {
					self.userToken = response.body['token']
					self.config.set('username', username)
					self.config.set('password', password)
					self.config.set('token', response.body['token'])
					self.config.set('loggedin', true)
					defer.resolve()
				} else {
					defer.reject('NOTP')
				}
			} else {
				defer.reject('')
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

	let cachn = which + '2';
	if (self.cache.has(cachn)) {
		defer.resolve(self.cache.get(cachn))
	} else {
		let wtxt = self.getI18n('CALMRADIO.'+which.toUpperCase())
		self.commandRouter.pushToastMessage('info', self.getI18n('CALMRADIO.UPDATING').replace('%',wtxt))
		self.logger.info('Getting Calm Radio '+which+' data')
		let request = unirest.get(CRURLS[which])
			.then(response => {
				if (response && response.status === 200) {
					let pdat = which=='categories' ? self.parseMetadata(response.body) : self.parseChannels(response.body)
					self.cache.set(cachn, pdat)
					defer.resolve(pdat)
				} else {
					defer.reject()
				}
			})
	}

	return defer.promise
}


ControllerCalmRadio.prototype.parseMetadata = function (data) {
	let rows = []
	let cats = []
	for (let row of data.metadata.rows) {
		let arow = []
		arow['id'] = row.id
		arow['title'] = row['title']
		arow['cats'] = row['categories'] || [row['category']]
		arow['art'] = row['background_art_url']
		rows[row['id']] = arow
	}
	for (let cat of data.metadata.categories) {
		let acat = []
		acat['id'] = cat.id
		acat['title'] = cat['title']
		acat['img'] = cat['square_art_url'] || cat['tiny_square_art_url'] || cat['hd_square_art_url'] || cat['background_art_url']
		acat['channels'] = cat['channels']
		cats[cat['id']] = acat
	}
	return {rows: rows, cats: cats}
}


ControllerCalmRadio.prototype.parseChannels = function (data) {
	let chns = []
	for (let chn of data.channels) {
		let achn = []
		achn['title'] = chn['title']
		achn['desc'] = chn['md_description'] || chn['description']
		achn['img'] = chn['tiny_square_art_url'] || chn['square_art_url'] || chn['hd_square_art_url']
		achn['story'] = chn['story']
		achn['cat'] = chn['category'] || 999
		achn['vip'] = chn['vip']
		achn['free'] = chn['free']
		chns[chn['id']] = achn
	}
	return chns
}


ControllerCalmRadio.prototype.getChannelFromUri = function (uri) {
	let self = this
	let defer = libQ.defer()

	let catId = uri.split('/')[2]
	let chanId = uri.split('/')[3]

	self.getCalmRadioData('channels')
		.then((chans) => {
			if (chans[chanId]) {
				defer.resolve(chans[chanId])
			} else {
				defer.reject()
			}
		})

	return defer.promise
}


ControllerCalmRadio.prototype.handleBrowseUri = function (curUri) {
	switch (curUri) {
		case 'calmradio://':
			return this.handleRootBrowseUri()

		default:
			return this.handleGroupBrowseUri(curUri)
	}
}


ControllerCalmRadio.prototype.doListGroup = function (gid) {
	let self = this
	let meta = self.cache.get('categories2')
	let grp = meta.rows[gid]
	let cats = []

	self.logger.info('Listing Calm Radio Categories for Group ' + grp.title)
	for (let cid of grp.cats) {
		let prop = {type: 'item-no-menu', title: meta.cats[cid].title, uri: `calmradio://${gid}/${cid}`}
		if (meta.cats[cid].img) {
			prop.albumart = CRURLS.arts + meta.cats[cid].img
		} else {
			prop.icon = 'fa fa-list'
		}
		cats.push(prop)
	}

	let browseResponse = {
		navigation: {
			lists: [
				{
					type: 'title',
					title: 'Calm Radio ' + self.getI18n('CALMRADIO.CATEGORIES'),
					availableListViews: ['grid'],
					items: cats
				}]
		}
	}
	self.commandRouter.translateKeys(browseResponse, self.i18nStrings, self.i18nStringsDefaults)

	return browseResponse
}


ControllerCalmRadio.prototype.doListGroups = function () {
	let self = this
	let grps = self.cache.get('categories2').rows
	let groupItems = []

	self.logger.info('Listing Calm Radio Groups')
	for (let [k, grp] of Object.entries(grps)) {
		let guri
		if (grp.cats.length > 1) {
			guri = `calmradio://${grp['id']}`
		} else {
			guri = `calmradio://${grp['id']}/${grp.cats[0]}`
		}
		groupItems.push({
			type: 'item-no-menu',
			title: grp['title'],
		//	icon: 'fa fa-list-alt',
			albumart: grp['art'] ? (CRURLS.arts + grp['art']) : '/albumart?sourceicon=music_service/calmradio/icons/bluecrlogo.png',
			uri: guri
		})
	}

	let browseResponse = {
		navigation: {
			lists: [
				{
					type: 'title',
					title: 'Calm Radio ' + self.getI18n('CALMRADIO.GROUPS'),
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
		//	defer.resolve(this.doListCategories())
			defer.resolve(this.doListGroups())
		})

	return defer.promise
}


ControllerCalmRadio.prototype.doListChannels = function (groupId, sterm=null) {
	let self = this
	self.logger.info('Calm Radio list channels for group '+groupId)
	let cats = self.cache.get('categories2').cats
	let cat = cats[groupId]
	let chans = self.cache.get('channels2')

	let channelItems = []
	let catt = cat.title + ' '
	for (let chann of cat.channels) {
		let channel = chans[chann]
		if (!sterm || sterm.test(channel.title) || sterm.test(channel.desc)) {
			let chant = 'webradio'	//channel.story ? 'song' : 'webradio'
		//	let chnid = channel['id']
			if (!self.isLoggedIn() && !channel.free[0]) {
				chant = 'item-no-menu'
			//	chnid = '-1'
				chann = '-1'
			}
			channelItems.push({
				type: chant,
				title: channel['title'].replace('CALMRADIO - ',''),
				albumart: CRURLS.arts + channel['img'],
				uri: `calmradio://${groupId}/${chann}`,
				service:'calmradio'
			})
		}
	}

	let browseResponse = {
		navigation: {
			lists: [
				{
					type: 'title',
					title: 'Calm Radio ' + catt,	// + self.getI18n('CALMRADIO.CHANNELS'),
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

	let [s1,s2,grpn,catn,chnn] = curUri.split('/')
	if (chnn) {
		if (chnn < 0) {
			self.commandRouter.pushToastMessage('error', self.getI18n('COMMON.LOGIN_FIRST'))
			defer.resolve({})
		}
	} else if (catn) {
		self.getCalmRadioData('channels')
			.then(() => {
				defer.resolve(this.doListChannels(catn))
			})
	} else {
		defer.resolve(this.doListGroup(grpn))
	}

	return defer.promise
}


ControllerCalmRadio.prototype.channelUri = function (chan) {
	let self = this

	if (self.isLoggedIn()) {
		let rate = self.config.get('bitrate', '64')
		let cred = '?user=' + encodeURIComponent(self.config.get('username')) + '&pass=' + self.config.get('token')
		return chan.vip[0].streams[rate] + cred
	} else {
		return chan.free[0].streams[128]
	}
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
				trackType: 'CalmRadio',
				radioType: 'web',
				name: chan['title'],
				title: chan['title'],
				albumart: CRURLS.arts + chan['img'],
				type: 'webradio'	//chan.story ? 'song' : 'webradio'
			})
		})

	return defer.promise
}


ControllerCalmRadio.prototype.getStreamUrl = function (curUri) {
	let defer = libQ.defer()
	let self = this

	let groupId = curUri.split('/')[2]
	let channelId = curUri.split('/')[3]
	self.logger.info('Calm Radio getStreamUrl for Cat ' + groupId + ' Chan ' + channelId)

	let explodeResp = {uri: ''}

	self.getChannelFromUri(curUri)
		.then((chan) => {
			explodeResp.uri = self.channelUri(chan)
			explodeResp.title = chan.title
			explodeResp.name = chan.title
			console.log('STREAMURL: '+explodeResp.uri)
			defer.resolve(explodeResp)
		})

	return defer.promise
}


ControllerCalmRadio.prototype.clearAddPlayTrack = function (track) {
	let self = this
	let defer = libQ.defer()

	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::clearAddPlayTrack')
	console.log(track)

	self.getStreamUrl(track.uri)
		.then((turl) => {
			return self.mpdPlugin.sendMpdCommand('stop',[])
				.then(function() {
					return self.mpdPlugin.sendMpdCommand('clear',[])
				})
			//	.then(function(stream) {
			//		return self.mpdPlugin.sendMpdCommand('load "'+turl.uri+'"',[])
			//	})
			//	.fail(function (e) {
			//		return self.mpdPlugin.sendMpdCommand('add "'+turl.uri+'"',[])
			//	})
        .then( () => {
            return self.mpdPlugin.sendMpdCommand('addid "' + turl.uri + '"', [])
        })
        .then( (addIdResp) => {
            if (addIdResp && typeof addIdResp.Id != undefined) {
                let trackId = addIdResp.Id
                let cmdAddTitleTag = {
                    command: 'addtagid',
                    parameters: [trackId, 'title', track.title]
                }
                return self.mpdPlugin.sendMpdCommandArray([cmdAddTitleTag])
            }
            else {
                return libQ.resolve()
            }
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


ControllerCalmRadio.prototype.next = function () {
	let self = this
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::next')
	return libQ.defer().reject(new Error())
}


ControllerCalmRadio.prototype.previous = function () {
	let self = this
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::previous')
	return libQ.defer().reject(new Error())
}


ControllerCalmRadio.prototype.seek = function (position) {
	let self = this
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::seek to '+position)
	let sm = self.context.coreCommand.stateMachine
	sm.setConsumeUpdateService('mpd', true, false)

	return libQ.defer().reject(new Error())
	return self.mpdPlugin.seek(position)
}


ControllerCalmRadio.prototype.stop = function () {
	let self = this
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::stop')

	return self.mpdPlugin.sendMpdCommand('stop', [])
}


ControllerCalmRadio.prototype.searchCategories = function (sterm) {
	let self = this
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::searchCategories')
	let cats = self.cache.get('categories2').cats
	let hits = []
	for (let [k, cat] of Object.entries(cats)) {
		if (sterm.test(cat.title)) {
			hits.push({
				type: 'item-no-menu',
				icon: 'fa fa-list',
				title: cat['title'],
				albumart: cat['img'] ? (CRURLS.arts + cat['img']) : '/albumart?sourceicon=music_service/calmradio/icons/bluecrlogo.png',
				uri: `calmradio://${cat['id']}`
			})
		}
	}
	return hits
}


ControllerCalmRadio.prototype.searchChannels = function (sterm) {
	let self = this
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerCalmRadio::searchChannels')
	let chans = self.cache.get('channels2')
	let hits = []
	for (let [k, chan] of Object.entries(chans)) {
		if (sterm.test(chan.title) || sterm.test(chan.desc)) {
			let chant = 'webradio'
			let chann = k
			if (!self.isLoggedIn() && !chan.free[0]) {
				chant = 'item-no-menu'
				chann = '-1'
			}
			hits.push({
				type: chant,
				title: chan['title'].replace('CALMRADIO - ',''),
				albumart: CRURLS.arts + chan['img'],
				uri: `calmradio://${chan.cat}/${chann}`,
				service:'calmradio'
			})
		}
	}
	return hits
}


ControllerCalmRadio.prototype.search = function (text) {
	let self = this
	let defer = libQ.defer()

	let rgx = new RegExp(text.value, 'i')
	let chlst = []

	chlst = chlst.concat(self.searchCategories(rgx))
	chlst = chlst.concat(self.searchChannels(rgx))

	defer.resolve([{
		title: 'Calm Radio',
		icon: 'fa-heartbeat',
		availableListViews: ['list'],
		items: chlst
	}])

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
	self.commandRouter.pushToastMessage('success', self.getI18n('CONFIG.SAVED'))
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
		.fail((fmsg) => {
			self.commandRouter.pushToastMessage('error', self.getI18n('COMMON.ERROR_LOGGING_IN'+fmsg))
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
