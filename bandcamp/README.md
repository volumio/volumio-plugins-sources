# Bandcamp Discover for Volumio

Volumio plugin for discovering Bandcamp music.

This plugin scrapes content from the Bandcamp website. If Bandcamp changes their site, then this plugin may no longer work until it is updated to match those changes. Furthermore, loading of some resources could take a while if the plugin has to gather data from multiple pages.

*This plugin is not affiliated with Bandcamp whatsoever.*

## Support Bandcamp and Artists

As the name implies, the purpose of this plugin is to allow you to discover music and artists on Bandcamp through Volumio. If you come across something you like, consider purchasing it on the Bandcamp website. To this end, the plugin displays links for accessing albums, artists and labels on Bandcamp (Volumio Contemporary / Classic UI only). You can also access the album or artist of a currently playing Bandcamp track through the menu in Volumio's player view (click the ellipsis icon to bring up the menu).

## Changelog

1.1.1
- Fix player state sometimes wrong when playing prefetched track

1.1.0
- My Bandcamp: add support for cookie-based fetching, thereby allowing access to private collections and high-quality MP3 streams of purchased media.
- Fix stream URLs sometimes broken (perhaps expired?). URLs are now tested and refreshed if necessary before playback.

1.0.3
- Improve Manifest UI detection
- Fix 'Goto artist / album' failing in some cases

1.0.2
- Fix fan item icon link typo
- Fix fan items pagination

1.0.1
- Fix plugin crashing on disable

1.0.0
- Rewrite in TypeScript
- Add prefetch support
- Fix Manifest UI detection broken by Volumio commit [db5d61a](https://github.com/volumio/volumio3-backend/commit/db5d61a50dacb60d5132238c7f506f0000f07e07)

0.1.5
- Fix: remove from browse sources on plugin stop

0.1.4
- Add "My Bandcamp" section. To enable, go to plugin settings and provide your Bandcamp username (fan account).

0.1.3
- Fixed adding current track to playlist / favorites in Playback view
- Because of fix above, track info now shows bitrate (as obtained by MPD) instead of bit depth and sample rate
- If Manifest UI is enabled, titles will be shown in plain text without formatting and links. For Bandcamp Daily, article texts will be hidden as they will not display nicely in Manifest UI's page anchors.

0.1.2
- Display search results by item type (configurable in plugin settings)

0.1.1
- Minor change to loading of translations
- Update plugin for Volumio 3

0.1.1-b.20211021
- Prepare plugin for Volumio plugin store

0.1.1-b.20211020
- Fixed album tracks all showing as 'non-playable' due to Bandcamp changes

0.1.0b-20210319
- Add release date to album header

0.1.0b-20210216
- Add Browse by Tags

0.1.0b-20210213.2
- Fixed more loading issues due to Bandcamp changes

0.1.0b-20210213
- Fixed album not loading due to Bandcamp changes

0.1.0b-20210210
- Added Bandcamp Daily and Shows

0.1.0a
- Initial release
