# YouTube Music plugin for Volumio

Credit goes to the [YouTube.js](https://github.com/LuanRT/YouTube.js) project. This plugin uses a [modified version](https://github.com/patrickkfkan/Volumio-YouTube.js) of that library for content fetching and ytmusic login.

## Changelog

1.0.0
- Rewrite in Typescript; major code overhaul with more generic fetching / processing of content.
- Add prefetch support and 'Prefer gapless Opus' option.
- Autoplay: fallback to radio if no items fetched - notably, when playing private uploads.
- Lazy-load Innertube API instead of loading when plugin starts, in case API causes system freeze or crash.

0.2.2
- Fix broken auth following YT changes (which causes Volumio to become unresponsive)

0.2.1
- Fix unable to sign in on Volumio rPi

0.2.0
- Fix Library content missing / incomplete due to YT Music changes
- Remove Recap from root items because it is now part of Home
- Add History to root items because it is no longer shown in the Library
- Fix Autoplay not fetching more songs in some cases

0.1.8
- Fix 'More' not working for albums, singles... on artist page

0.1.7
- Fix playback of playlists through the Play button
- Add Recap
- Display 'Showing results for...' message in search results

0.1.6
- Fix plugin failing to start due to error in extracting sig decipher algorithm from player object

0.1.5
- Fix playback sometimes fails when signed in with YT Premium account

0.1.4
- Bug fixes with autoplay and browsing of artists in Library -> Uploads
- Add 'Add to history' setting

0.1.3
- Add 'Load full playlists' setting

0.1.2
- Add Autoplay
- Fix browsing and playback of uploads

0.1.1
- Various fixes and changes to display of items
- Show 'did you mean' in search results
- Faster and more robust manual installation process

0.1.0
- Initial release
