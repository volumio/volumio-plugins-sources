/**
 * Copy of this fork of node-plex-api-pinauth https://github.com/Zefau/node-plex-api-pinauth
 * This has been converted to use kew promises in order to provide greater flexiblity in other code.
 */

const request = require('request-promise');
const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
const libQ = require('kew');

const HEADERS = {
    'X-Plex-Client-Identifier': 'identifier',
    'X-Plex-Product': 'product',
    'X-Plex-Version': 'version',
    'X-Plex-Device': 'device',
    'X-Plex-Device-Name': 'deviceName',
    'X-Plex-Platform': 'platform',
    'X-Plex-Platform-Version': 'platformVersion'
};

const xml = new XMLParser();

/**
 * The constructor for PlexPinAuth.
 *
 * @class PlexPinAuth
 * @param {object}			options			Required headers
 * @param {string}			options.
 * @returns {PlexPinAuth}
 * @constructor
 */
var PlexPinAuth = function(options)
{
    if (!(this instanceof PlexPinAuth))
        return new PlexPinAuth(options);

    this.headers = this.getHeaders(options || {});
    this.tokens = {};
};

/**
 * This function converts the options to headers.
 *
 * @param void
 * @returns {Promise<Object>}
 */
PlexPinAuth.prototype.getHeaders = function(options)
{
    let headers = {};
    let val;

    for (let key in HEADERS)
    {
        val = options[HEADERS[key]] || false;
        if (val !== false)
            headers[key] = val;
    }

    headers['X-Plex-Provides'] = 'controller'
    return headers;
};

/**
 * This function requests a new pin.
 *
 * @param void
 * @returns {Promise<Object>}
 */
PlexPinAuth.prototype.getPin = function()
{
    var defer = libQ.defer();

    request.post({
            url: 'https://plex.tv/pins.xml',
            headers: this.headers
            })
            .then(res => {
                let response;
                try {
                    response = xml.parse(res);
                    defer.resolve(response.pin);
                } catch(err) {
                    defer.reject(err);
                }
        })
        .catch(err => { return defer.reject(err); });

    return defer.promise;
};

/**
 * This function retrieves the token based on a pin.
 *
 * @param {number}		pin			PIN
 * @returns {Promise<Object>}
 */
PlexPinAuth.prototype.getToken = function(pin)
{
    var defer = libQ.defer();

    // retrieve from cache
    if (this.tokens[pin]) {
        defer.resolve({
            'token': true,
            status: 'RETRIEVED_TOKEN',
            'auth-token': this.tokens[pin]
        });

        return defer.promise;
    }

    // no cache, thus retrieve online
    request.get({
        url: 'https://plex.tv/pins/' + pin + '.xml',
        headers: this.headers
    })
    .then(res => {
            let response;
            try {
                response = xml.parse(res);
                response.pin.token = null;
                response.pin.status = 'RETRIEVING_TOKEN';

                // check for timeout
                if (new Date().toISOString() >= response.pin['expires-at']) {
                    response.pin.token = false;
                    response.pin.status = 'TIMEOUT_TOKEN';
                }

                // token retrieved
                if (response.pin['auth-token']) {
                    response.pin.token = true;
                    response.pin.status = 'RETRIEVED_TOKEN';
                    this.tokens[pin] = response.pin['auth-token'];
                }

                defer.resolve(response.pin);
            } catch(err) {
                defer.reject(err);
            }
        })
        .catch(err => { defer.reject(err); });

    return defer.promise;
};


module.exports = PlexPinAuth;
