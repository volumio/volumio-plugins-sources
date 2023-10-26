# YouTube Cast Receiver for Volumio

Plugin that enables Volumio to act a YouTube Cast receiver device. Supports casting from YouTube and YouTube Music.

# Changelog

1.0.5
- Fix player not reconnecting with MPD after being disconnected, such as when MPD restarts following a change in configuration.

1.0.4
- Add prefetching of next track
- Add 'prefer Opus streams' option when prefetching enabled
- Use Volumio player name as device name (the name that appears in the Cast menu of clients)

1.0.3
- Add option to stop playback only when all clients have been *explicitly* disconnected

1.0.2
- Remove commented-out code
- Remove links from package author because they don't look good when shown in Volumio plugin store

1.0.1
- Add i18n settings
- Add option to clear persisted data
- Bug fixes

1.0.0
- Add YouTube Music support
- Allow multiple connections
- Support manual pairing, aka Link with TV Code (YouTube only)
- Support playback of private videos and music

0.1.3
- Fix MPD connection
- Update dependency versions; replace deprecated `request` with `node-fetch`

0.1.2
- Improve fetching of audio URLs

0.1.1
- Check audio URLs and refetch on error response (retry up to 5 times)
- Minor change to loading of translations
- Update plugin for Volumio 3

0.1.0-b
- Version change to mark update of yt-cast-receiver module to version 0.1.1-b

0.1.0a-20210627
- Adapt to YouTube changes
- Really fix compatibility with Volumio 2.x
- Add 'Bind to Network Interface' setting

0.1.0a-20210620-2
- Fix compatibility with Volumio 2.x

0.1.0a-20210620
- Update yt-cast-receiver module

0.1.0a-20210419
- More robust transition from another service

0.1.0a-20210417
- Add livestream support

0.1.0a
- Initial release
