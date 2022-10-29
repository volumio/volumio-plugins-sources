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

Plexcloud.prototype.getServers = function(token, resolve)
{
    if (token === undefined) {
        throw Error("No token provided");
    }

    this.headers["X-Plex-token"] = token;

    return request.get({url: 'https://plex.tv/pms/servers', headers: this.headers})
        .then(function(xml) {
            parseString(xml, function (err, json) {
                resolve(json);
            });
        })
        .catch(err => {throw(err)});
};



module.exports = Plexcloud;