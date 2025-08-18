var url = require('url');
var parseString = require('xml2js').parseString;
// Extra call to return list of servers from myplex
const request = require('request-promise');

const HEADERS = {
    'X-Plex-Client-Identifier': 'identifier',
    'X-Plex-Product': 'product',
    'X-Plex-Version': 'version',
    'X-Plex-Device': 'device',
    'X-Plex-Device-Name': 'deviceName',
    'X-Plex-Platform': 'platform',
    'X-Plex-Platform-Version': 'platformVersion'
};

var Plexcloud = function(options)
{
    if (!(this instanceof Plexcloud))
        return new Plexcloud(options);

    this.headers = this.getHeaders(options || {});
};

Plexcloud.prototype.getHeaders = function(options)
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


function resourceConnectionFilter(json) {

    var results = [];

    if (!json.hasOwnProperty("MediaContainer") || !json.MediaContainer.hasOwnProperty("Device")
        || typeof(json.MediaContainer.Device) != "object" || json.MediaContainer.Device.constructor !== Array) {
        return results;
    }

    json.MediaContainer.Device.
        filter(dev => dev.$.product == "Plex Media Server"  &&
               dev.hasOwnProperty("Connection") &&
               dev.Connection.constructor === Array &&
               dev.Connection.length >= 1 ).forEach( (device) => {

                   device.Connection.forEach( (connection) => {
                       results.push( {
                           "name": device.$.name,
                           "protocol": connection.$.protocol,
                           "address": connection.$.address,
                           "port": connection.$.port,
                           "local": connection.$.local == "1"
                       } );
                   });
               });
    return results;
}

Plexcloud.prototype.getServers = function(token, resolve, reject)
{
    if (token === undefined) {
        throw Error("No token provided");
    }

    this.headers["X-Plex-token"] = token;

    return request.get({url: 'https://plex.tv/pms/resources', headers: this.headers})
        .then(function(xml) {
            parseString(xml, function (err, json) {
                resolve(resourceConnectionFilter(json));
            });
        })
        .catch(function(err){
            reject(err);
        });
};

Plexcloud.prototype.getClaimToken = function(token, resolve, reject)
{
    if (token === undefined) {
        throw Error("No token provided");
    }

    this.headers["X-Plex-token"] = token;

    return request.get({url: 'https://plex.tv/api/claim/token.json', headers: this.headers})
        .then(function(json) {
            resolve(json);
        })
        .catch(function(err){
            reject(err);
        });
};



module.exports = Plexcloud;
