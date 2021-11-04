# YouTube2 plugin for Volumio

Volumio plugin for browsing YouTube videos and playing audio streams.

This repository has two branches:

1. The `master` branch is targeted towards Volumio 3.
2. The `volumio-2.x` branch is targeted towards Volumio 2.x.

The focus is on the `master` branch. The `volumio-2.x` branch will only be maintained if it is practically feasible and still worthwhile to do so.

### Plugin Settings

#### Data Retrieval Methods

#### *Scraping*

Data is retrieved through sending requests to the YouTube website and parsing the response. The advantage is you don't need to set up API credentials or be subject to API quota limits. The disadvantage is, if YouTube changes their website, then data retrieval may fail until the scraping libraries which this plugin uses are updated to match the site changes. Another disadvantage is the possibility of getting temporarily blocked by YouTube if you make requests too often (the plugin uses caching to reduce the risk of this happening).

#### *Google YouTube API*

Data is retrieved through the official Google YouTube API. You need to set up API credentials in the [Google Cloud Platform](https://console.cloud.google.com/apis/dashboard) and provide them in the settings. Once the credentials are processed successfully, you will be able to access your subscriptions, playlists, etc. Note that you will be subject to a daily quota limit of 10,000 units that are consumed as the plugin retrieves data through the API (when you, for example, view a channel or perform a search). Once the limit is exceeded, the Google YouTube API will reject further requests for data. The number of quota units consumed will depend on the operation performed, with searches being the most costly (at 100 units per search). The plugin tries to reduce quota consumption by caching viewed items for a period of time.

You can create API credentials with [this guide](./gapi_setup.md).

>Regardless of which method you choose, scraping is **always** used to retrieve the audio stream from a video. The Google YouTube API does not provide a method to do this (for obvious reasons).

#### Front Page Sections

You can add, remove or disable sections that are shown on the front page of the plugin. For each section, you can specify the type of item to display (channel, playlist or video) and the keywords to match items against.

If you use Google YouTube API for data retrieval, then you should consider whether you should remove or disable front page sections completely to save quota. As previously mentioned, each search operation consumes 100 quota units. If you have three sections enabled on the front page, it would cost you 300 quota units to display them.

### Volumio Playlists

You can add a YouTube channel, playlist or video to a playlist created within Volumio, but you should be aware of the following:
1. When you click on a single item in the playlist, Volumio will add all items in that playlist to the queue.
2. For each item added to the queue, Volumio will ask the plugin for track information such as title and artist. If the item is a YouTube channel or playlist, the plugin will fetch videos within the channel or playlist and return track information for each of the videos (up to the number specified by Items Per Page in the plugin settings).
3. The plugin uses caching to store previously viewed items and returns cached data whenever possible. This includes track information for Volumio playlist items. However, the cache is not persistent and will expire after a certain period of time to save memory.
4. When track information cannot be found in the plugin's cache, the plugin will have to request the information from YouTube. This means if you have lots of items in the playlist, then there will potentially be many requests made to YouTube.
5. If you are using 'scraping' for data retrieval, YouTube may treat the flood of requests as spamming and temporarily block you from accessing their service; if you are using 'Google YouTube API', this may have a significant impact on your quota usage.
6. For this reason, it is not advisable to have a huge playlist of YouTube items in Volumio.

>It is better to store a YouTube playlist that contains 50 videos in a Volumio playlist, than to store 50 YouTube videos. The plugin may only have to make a couple of requests to obtain track information on all 50 videos in a YouTube playlist, but it will always have to make 50 requests to obtain information on 50 single YouTube videos.

### Technical Notes

The plugin uses the following libraries for obtaining data through scraping (credit due to the authors):

|Library                                                          |Forked for plugin                                     |Purpose                                    |
|-----------------------------------------------------------------|------------------------------------------------------|-------------------------------------------|
|[youtube-scrape](https://github.com/HermanFassett/youtube-scrape)|[Yes](https://github.com/patrickkfkan/youtube-scrape) |Search for channels, playlists and videos  |
|[ytpl](https://github.com/TimeForANinja/node-ytpl)               |No                                                    |Fetch playlist info and playlist videos    |
|[yt-channel-info](https://github.com/FreeTubeApp/yt-channel-info)|[Yes](https://github.com/patrickkfkan/yt-channel-info)|Fetch channel info and channel playlists   |
|[ytdl-core](https://www.npmjs.com/package/ytdl-core)             |No                                                    |Fetch video info and audio stream URL      |
|[yt-mix-playlist](https://github.com/patrickkfkan/yt-mix-playlist)|N/A                                                  |Fetch Mix playlists                        |

### Changelog

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
