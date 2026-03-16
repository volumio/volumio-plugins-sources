const plexcloud = require("../plexcloud");
const config = new (require('v-conf'))();
const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
describe('plex', () => {
    let plexcloudapi = null;

    beforeEach(() => {
        self.plexCloudOptions = {
            identifier: '983-ADC-213-BGF-132',	// Some unique ID
            product: 'Volumio-PlexAmp',	// Some suitable name for this plugin when it appears in Plex
            version: '1.0',
            deviceName: 'RaspberryPi',	// Maybe query the device Id eventually
            platform: 'Volumio'
        };
        plexcloudapi = new plexcloud(plexCloudOptions);
    });

    afterEach(() => {
        plexcloudapi = null;
    });

    test('get Claim Token', async () => {
        var token = config.get('token');	// Let assume for now if we have a token it valid
        plexcloud.getClaimToken(token, function(claimToken) {
            defer.resolve(claimToken);
        }, function(error) {
            defer.reject(error);
        });
    });

    test('should log and reject with error when token does not exist', async () => {
    });
});