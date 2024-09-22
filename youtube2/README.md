# YouTube2 plugin for Volumio

Credit goes to the [YouTube.js](https://github.com/LuanRT/YouTube.js) project. This plugin uses a [modified version](https://github.com/patrickkfkan/Volumio-YouTube.js) of that library for content fetching and YouTube login.

### Changelog

1.2.2
- Fix hanging "InnertubeLoader: creating Auth instance..."
- Fix broken playback due to YT changes (credit: [#713] (https://github.com/LuanRT/YouTube.js/pull/713))

1.2.1
- Fix broken playback due to YT changes (credit: [#698](https://github.com/LuanRT/YouTube.js/pull/698))

1.2.0
- Provide metadata to Now Playing plugin
- Bug fixes

1.1.6
- Fix broken playback due to YT changes (credit: [#682](https://github.com/LuanRT/YouTube.js/pull/682))

1.1.5
- Fix issues with prefetch and autoplay

1.1.4
- Fix broken API requests due to YT changes

1.1.3
- Fix recursive loading of playlist items (when 'Load Full Playlist' enabled)
- Lazy-load Innertube API instead of loading when plugin starts, in case API causes system freeze or crash.
- Refactoring: endpoints, method signatures, etc.

1.1.2
- Fix broken auth (which causes Volumio to become unresponsive)

1.1.1
- Add 'YouTube Playback Mode' setting
- Minor UI fixes

1.1.0
- Migrate to TypeScript
- Add prefetch support
- Add option to fetch autoplay videos from Mixes and Related Videos in preference to using YouTube's default
- In plugin settings, warn user when Autoplay is enabled but Add to History isn't (this can lead to high number of repeating autoplay videos).

1.0.1
- Major update! Most things have changed:
  - Much simpler sign-in process - no Google API credentials required.
  - Contents mirror as closely as possible those of YouTube website. This means much wider content available.
  - You can now browse and play your saved playlists (not only created ones), private / unlisted playlists, videos, etc.
  - Live stream support.
  - Playback and autoplay follows YouTube's behavior.

0.1.8
- [Fixed] Adding current track to playlist / favorites in Playback view
- [Changed] Because of fix above, track info now shows bitrate instead of bit depth and sample rate
- [Added] Goto album / artist

0.1.7
- [Changed] Improve fetching of audio URLs and playback (should improve stability)

0.1.6
- [Fixed] Loading of translations

0.1.5
- [Changed] Repackage plugin to fit Volumio 3 size limit requirements
- [Changed] Refetch audio URLs increase to 5 max retries

0.1.4
- [Fixed] `contentDetails` missing in getVideo() (gapi model) which, among other things, breaks autoplay
- [Changed] Update package.json to meet plugin submission criteria for Volumio 3

0.1.3
- [Changed] Check audio URLs and refetch if 403 or 404 response encountered
- [Changed] Update plugin for Volumio 3

0.1.2
- [Changed] More robust fetching of Mix playlists for autoplay
- [Added] Google API Setup Guide button in plugin settings

0.1.1a-20210825:
- [Added] Show video durations

0.1.1a-20210822:
- [Changed] Google API credentials setup guide

0.1.1a-20210627:
- [Fixed] Playback broken due to YouTube changes
- [Changed] Google API access status should now persist across future updates

0.1.1a-20200311:
- [Fixed] Scraping broken due to YouTube changes
- [Fixed] Playlist videos pagination bug

0.1.0a-20201226:
- [Changed] Updated yt-mix-playlist
- [Changed] Adapt to API changes in ytdl-core
- [Fixed] Single video failing to play

0.1.0a-20201225:
- [Changed] Fetch autoplay videos from Mix playlists if available - greatly reduces chance of entering a loop. If Mix playlist not available, fetch randomly from related videos before resorting to 'Up Next'.
- [Changed / Fixed] Added 'album' labels to videos - fixes Last 100 plugin not adding YouTube tracks.

0.1.0a-20201222:
- [Added] Autoplay (experimental)
- [Added] Cache settings

0.1.0a-20201219:
- [Fixed] Volumio playlist items added from queue cannot be played

0.1.0a-20201218:
- [Fixed] Plugin settings show incorrect values on refresh when UIConfig sections have changed

0.1.0a
- Initial release
