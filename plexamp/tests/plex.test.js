const plex = require("../plex");
const config = new (require('v-conf'))();
const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
describe('plex', () => {
    let plexapi = null;

    beforeEach(() => {
        plexapi = new plex(logger, config);
    });

    afterEach(() => {
        plexapi = null;
    });

    test('should create a new PlexAPI client with correct options when token exists', async () => {
        config.set("token", "hzaPD5buKGsnbYUTXt7Z");
        config.set("server", "192.168.31.201");
        plexapi.connect().then(
            plexapi.query()
        );
    });

    test('should log and reject with error when token does not exist', async () => {
    });
});