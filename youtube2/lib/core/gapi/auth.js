'use strict';

const libQ = require('kew');
const https = require('https');
const querystring = require('querystring');

class AuthManager {

    constructor(credentials, logger, storage) {
        let self = this;

        self.credentials = credentials;
        self.logger = logger;
        self.storage = storage;
        self.listeners = {};

        self.setAuthStatus(AuthManager.STATUS_INITIALIZING);

        if (credentials) {
            self.accessToken = self.getAccessTokenFromStorage();
            if (self.accessToken) {
                self.autoRefreshAccessToken();
            }
            else {
                self.startAuthFlow();
            }
        }
        else {
            self.accessToken = null;
        }
    }

    on(event, callback) {
        if (this.listeners[event] == undefined) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    setCredentials(credentials) {
        let credentialsChanged = 
            (this.credentials && !credentials) || 
            (credentials && !this.credentials) ||
            ((this.credentials && credentials) && 
            (this.credentials.clientId !== credentials.clientId || 
            this.credentials.clientSecret !== credentials.clientSecret));
        
        if (credentialsChanged) {
            this.logger.info('[youtube2-auth] API credentials changed. Starting auth flow with new credentials...');
            this.credentials = credentials;
            this.startAuthFlow();
        }
    }

    startAuthFlow() {
        let self = this;

        self.logger.info('[youtube2-auth] Starting auth flow...');

        self.setAuthStatus(AuthManager.STATUS_PREPARING_AUTH_FLOW);

        if (self.accessTokenPoller) {
            self.accessTokenPoller.abort();
            self.accessTokenPoller = null;
        }

        if (self.accessTokenRefresher) {
            self.accessTokenRefresher.abort();
            self.accessTokenRefresher = null;
        }

        self.invalidateGrantAccessPage();
        self.setAndSaveAccessTokenToStorage(null);

        if (self.credentials) {
            self.setAuthStatus(AuthManager.STATUS_FETCHING_GRANT_ACCESS_PAGE);

            self.getGrantAccessPageInfo().then( (pageInfo) => {
                self.grantAccessPage = new AuthManager.GrantAccessPage(pageInfo);
                self.grantAccessPage.onExpiry(self.startAuthFlow.bind(self));

                self.setAuthStatus(AuthManager.STATUS_PENDING_USER_GRANT_ACCESS, {
                    grantAccessPageInfo: pageInfo
                });

                self.accessTokenPoller = new AuthManager.AccessTokenPoller(self.credentials, pageInfo.device_code, pageInfo.interval, {
                    success: (accessToken) => {
                        self.invalidateGrantAccessPage();
                        self.accessTokenPoller = null;
                        self.setAndSaveAccessTokenToStorage(accessToken);
                        self.setAuthStatus(AuthManager.STATUS_ACCESS_GRANTED, {
                            credentials: self.credentials,
                            accessToken: accessToken
                        });
                        self.autoRefreshAccessToken(false);
                    },
                    error: (error) => {
                        self.invalidateGrantAccessPage();
                        self.accessTokenPoller = null;
                        self.setAndSaveAccessTokenToStorage(null);
                        self.setAuthStatus(AuthManager.STATUS_AUTH_ERROR, {
                            error: error
                        });
                    }
                }, self.logger);
                self.accessTokenPoller.start();

            }).fail( (error) => {
                self.logger.error('[youtube2-auth] Failed to obtain \'grant access page\' info: ' + JSON.stringify(error));
                self.setAndSaveAccessTokenToStorage(null);
                self.setAuthStatus(AuthManager.STATUS_AUTH_ERROR, {
                    error: error
                });
            });
        }
    }

    getGrantAccessPageInfo() {
        let self = this;
        let defer = libQ.defer();

        let postData = querystring.stringify({
            'client_id': self.credentials.clientId,
            'scope': 'https://www.googleapis.com/auth/youtube.readonly'
        });

        let options = {
            host: 'accounts.google.com',
            path: '/o/oauth2/device/code',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        let req = https.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (raw) => {
                let grantAccessPageInfo = JSON.parse(raw);
                if (grantAccessPageInfo.verification_url != undefined &&
                    grantAccessPageInfo.user_code != undefined) {
                        defer.resolve(grantAccessPageInfo);
                }
                else if (grantAccessPageInfo.error) {
                    defer.reject(grantAccessPageInfo.error + (grantAccessPageInfo.error_description ? ' - ' + grantAccessPageInfo.error_description : ''))
                }
                else {
                    defer.reject('Unknown error');
                }
            });
        });

        req.on('error', (error) => {
            deferred.reject(error);
        });

        req.write(postData);
        req.end();

        return defer.promise;
    }

    autoRefreshAccessToken(noWait = true) {
        let self = this;

        self.accessTokenRefresher = new AuthManager.AccessTokenRefresher(self.credentials, self.accessToken, {
            onStart: () => {
                self.setAuthStatus(AuthManager.STATUS_REFRESHING_ACCESS_TOKEN);
            },
            success: (newAccessToken) => {
                self.accessToken.expires_in = newAccessToken.expires_in;
                self.accessToken.access_token = newAccessToken.access_token;
                self.setAndSaveAccessTokenToStorage(self.accessToken);
                self.setAuthStatus(AuthManager.STATUS_ACCESS_TOKEN_REFRESHED, {
                    credentials: self.credentials,
                    accessToken: newAccessToken
                });
            },
            error: (error) => {
                self.setAndSaveAccessTokenToStorage(null);
                self.setAuthStatus(AuthManager.STATUS_AUTH_ERROR, {
                    error: error
                });
                self.startAuthFlow();
            }
        }, self.logger);

        self.accessTokenRefresher.start(noWait);
    }

    setAndSaveAccessTokenToStorage(accessToken) {
        this.accessToken = accessToken;
        this.storage.set('accessToken', accessToken);
    }

    setAuthStatus(status, data = null) {
        this.authStatus = status;

        if (this.listeners['authStatusChanged']) {
            this.listeners['authStatusChanged'].forEach( (callback) => {
                callback(status, data);
            });
        }
    }

    getAccessTokenFromStorage() {
        return this.storage.get('accessToken');
    }

    invalidateGrantAccessPage() {
        if (this.grantAccessPage) {
            this.grantAccessPage.invalidate();
            this.grantAccessPage = null;
        }
    }

    destroy() {
        if (this.accessTokenPoller) {
            this.accessTokenPoller.abort();
            this.accessTokenPoller = null;
        }

        if (this.accessTokenRefresher) {
            this.accessTokenRefresher.abort();
            this.accessTokenRefresher = null;
        }

        this.invalidateGrantAccessPage();

        this.storage = null;
        this.listeners = {};
        this.authStatus = null;
    }
}

AuthManager.STATUS_INITIALIZING = 0;
AuthManager.STATUS_ACCESS_GRANTED = 1;
AuthManager.STATUS_PREPARING_AUTH_FLOW = 2;
AuthManager.STATUS_FETCHING_GRANT_ACCESS_PAGE = 3;
AuthManager.STATUS_PENDING_USER_GRANT_ACCESS = 4;
AuthManager.STATUS_REFRESHING_ACCESS_TOKEN = 5;
AuthManager.STATUS_ACCESS_TOKEN_REFRESHED = 6;
AuthManager.STATUS_AUTH_ERROR = -1;

AuthManager.AccessTokenPoller = class {

    constructor(credentials, deviceCode, pollInterval, callback, logger) {
        this.credentials = credentials;
        this.deviceCode = deviceCode;
        this.pollInterval = pollInterval;
        this.callback = callback;
        this.logger = logger;
        this.status = 'idle';
    }

    start() {
        if (this.status === 'idle') {
            this.logger.info('[youtube2-auth] Start polling for access token...');
            this.status = 'polling';
            this.doPoll();
        }
    }

    abort() {
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        this.status = 'aborted';
    }

    doPoll() {
        let self = this;

        self.tryGetAccessToken().then( (accessToken) => {
            if (self.status !== 'aborted') {
                if (accessToken) {
                    self.status = 'stopped';
                    self.logger.info('[youtube2-auth] Access token obtained');
                    self.callbackSuccess(accessToken);
                }
                else {
                    self.logger.info('[youtube2-auth] Access token not obtained. Will try again in ' + (self.pollInterval + 1) + 's');
                    self.pollTimer = setTimeout(self.doPoll.bind(self), (self.pollInterval + 1) * 1000);
                }
            }
        }).fail( (error) => {
            if (self.status !== 'aborted') {
                self.status = 'error';
                self.logger.error('[youtube2-auth] Failed to obtain access token: ' + JSON.stringify(error));
                self.callbackError(error);
            }
        });
    }

    callbackSuccess(accessToken) {
        if (this.callback.success) {
            this.callback.success(accessToken);
        }
    }

    callbackError(error) {
        if (this.callback.error) {
            this.callback.error(error);
        }
    }

    tryGetAccessToken() {
        let self = this;
        let defer = libQ.defer();
      
        let postData = querystring.stringify({
            'client_id': self.credentials.clientId,
            'client_secret': self.credentials.clientSecret,
            'code': self.deviceCode,
            'grant_type': 'http://oauth.net/grant_type/device/1.0'
        });
      
        let options = {
            host: 'www.googleapis.com',
            path: '/oauth2/v4/token',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            }
        };

        let req = https.request(options, (res) => {
            res.setEncoding('utf8');

            res.on('data', (raw) => {
                let data = JSON.parse(raw);
                let statusCode = res.statusCode;
                if (statusCode == '200') {
                    defer.resolve(data); // resolve access token
                }
                else if (statusCode == '400' || statusCode == '428') { // Code 428 (Precondition Failed) can also be returned for auth pending...
                    defer.resolve();
                }
                else {
                    // Consider other statusCodes as error
                    defer.reject(new Error(data.error + ': ' + data.error_description));
                }
            });
        });
      
        req.on('error', (error) => {
            defer.reject(error);
        });
      
        req.write(postData);
        req.end();

        return defer.promise;
    }
}

AuthManager.AccessTokenRefresher = class {

    constructor(credentials, accessToken, callback, logger) {
        this.credentials = credentials;
        this.accessToken = accessToken;
        this.callback = callback;
        this.logger = logger;
        this.status = 'idle';
    }

    start(noWait = true) {
        if (this.status === 'idle') {
            if (noWait) {
                this.doRefresh();
            }
            else {
                this.status = 'pending_expiry';
                this.logger.info('[youtube2-auth] Refreshing access token in ' + this.accessToken.expires_in + 's');
                this.refreshTimer = setTimeout(this.doRefresh.bind(this), this.accessToken.expires_in * 1000);
            }
        }
    }

    abort() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.status = 'aborted';
    }

    doRefresh() {
        let self = this;

        self.status = 'refreshing';
        self.callbackOnStart();
        self.tryRefreshAccessToken().then( (newAccessToken) => {
            if (self.status !== 'aborted') {
                self.status = 'pending_expiry';
                self.accessToken.expires_in = newAccessToken.expires_in;
                self.accessToken.access_token = newAccessToken.access_token;
                self.refreshTimer = setTimeout(self.doRefresh.bind(self), self.accessToken.expires_in * 1000);
                self.logger.info('[youtube2-auth] Access token refreshed. Refreshing again in ' + self.accessToken.expires_in + 's');
                //self.logger.info('[youtube2-auth] The access token is now: ' + JSON.stringify(self.accessToken));
                self.callbackSuccess(self.accessToken);
            }
        }).fail( (error) => {
            if (self.status !== 'aborted') {
                self.status = 'error';
                self.logger.error('[youtube2-auth] Failed to refresh access token: ' + error);
                self.callbackError(error);
            }
        });
    }

    callbackOnStart() {
        if (this.callback.onStart) {
            this.callback.onStart();
        }
    }

    callbackSuccess(accessToken) {
        if (this.callback.success) {
            this.callback.success(accessToken);
        }
    }

    callbackError(error) {
        if (this.callback.error) {
            this.callback.error(error);
        }
    }

    tryRefreshAccessToken() {
        let self = this;
        let defer = libQ.defer();

        self.logger.info('[youtube2-auth] Refreshing access token...');

        let postData = querystring.stringify({
            'client_id': self.credentials.clientId,
            'client_secret': self.credentials.clientSecret,
            'refresh_token': self.accessToken.refresh_token,
            'grant_type': 'refresh_token'
        });

        let options = {
            host: 'www.googleapis.com',
            path: '/oauth2/v4/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        let req = https.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (raw) => {
                let statusCode = res.statusCode;
                if (statusCode == '200') {
                    let accessToken = JSON.parse(raw);
                    defer.resolve(accessToken);
                } else {
                    defer.reject(raw);
                }
            });
        });

        req.on('error', (error) => {
            defer.reject(error);
        });

        req.write(postData);
        req.end();

        return defer.promise;
    }
}

AuthManager.GrantAccessPage = class {
    
    constructor(pageInfo) {
        this.pageInfo = pageInfo;
        this.status = 'valid';
    }

    invalidate() {
        if (this.expiryTimer) {
            clearTimeout(this.expiryTimer);
            this.expiryTimer = null;
        }
        this.status = "invalid";
    }

    onExpiry(callback) {
        let self = this;
        
        self.expiryTimer = setTimeout( () => {
            if (self.status !== 'invalid') {
                callback();
            }
        }, self.pageInfo.expires_in * 1000);
    }
}

module.exports = AuthManager;