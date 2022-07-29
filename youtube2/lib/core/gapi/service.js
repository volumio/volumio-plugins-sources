'use strict';

const {google} = require('googleapis');

class YouTubeService {

    constructor() {
        this._client = null;
    }

    setAccessToken(credentials, accessToken) {
        if (credentials && accessToken) {
            let redirectUri = credentials.redirectUris ? credentials.redirectUris[0] : 'http://127.0.0.1:9004';

            let oauth2Client = new google.auth.OAuth2(
                credentials.clientId,
                credentials.clientSecret,
                redirectUri
            );
            oauth2Client.setCredentials(accessToken);

            this._client = google.youtube({
                version: 'v3',
                auth: oauth2Client
            });
        }
        else {
            this._client = null;
        }
    }

    getResource(resource) {
        if (this._client && this._client[resource]) {
            return this._client[resource];
        }
        return null;
    }
}

module.exports = YouTubeService;