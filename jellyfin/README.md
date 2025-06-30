# Jellyfin plugin for Volumio

Volumio plugin for playing audio from one or more [Jellyfin](https://jellyfin.org/) servers. It has been tested with Jellyfin 10.9.6.

#### Adding a Jellyfin Server

A Jellyfin server can be on the same network as your Volumio device, or it can be remote (of course, you would have to configure the server so that it is accessible from the Internet). You can add a server in the "Add a Server" section of the plugin settings.


*Make sure you provide the full server address. "http://www.myjellyfinserver.com:8096" would be a valid example, but leaving out the "http://" will render it invalid.*

You can add multiple servers, each with multple user accounts, and those that are reachable will appear on the plugin landing page.

#### Notes

- Audio is served through Direct Streaming. This means when you play a song, it will be streamed to Volumio in its original format without any modifications. This gives you the highest sound quality possible but, if you are streaming from a remote server, then you should consider whether your Internet connection has sufficient bandwidth to handle the traffic.
- Since v1.0.4, adding songs to or removing songs from Favorites in Volumio will trigger the same action on Jellyfin server. However, due to Volumio's sketchy, bug-ridden and inconsistent implementation of the Favorites feature, there are a few things you should note:
  1. In Volumio, clicking the heart icon of a song when browsing the library will mark it as favorite, but the heart icon will not stay 'on'. You would have to navigate out of the view and then back in in order to see the updated status.
  2. Also on the browsing screen, clicking the heart icon of a song that has been marked favorite will not unmark it. You would have to do it in Volumio -> Favorites. You can also unmark the song on the player screen *while it is playing*.
  3. When playing a song with the Jellyfin plugin, the favorite status is reflected correctly by the heart icon on the player screen. However, during this time if you mark or unmark another song from any source as favorite, the heart icon will change to show the updated status of that song instead.
  4. The heart icon on the player screen can be used to mark or unmark a song as favorite *while it is playing*. However, if the song is not playing, Volumio will bypass the custom logic implemented in the Jellyfin plugin. The result is that the favorite status of the song will not be updated on the Jellyfin server and the song's URI added to Favorites will not be one canonicalized by the plugin.

The [Jellyfin SDK]((https://github.com/patrickkfkan/jellyfin-sdk-typescript/)) used by this plugin was forked from https://github.com/jellyfin/jellyfin-sdk-typescript. It has been adapted to work under the Node 14 + CommonJS environment of Volumio.
  
#### Changelog

1.1.1
- [Fixed] Missing dependency

1.1.0
- [Changed] Bump Jellyfin SDK v0.10.0. As a result, support moved to server version 10.9.x.
- [Added] Provide metadata to Now Playing plugin

1.0.9
- [Fixed] Player state sometimes wrong when playing prefetched track

1.0.8
- [Fixed] Track type injection into stream URL breaks native DSD playback
- [Fixed] Song thumbnail not falling back to album's albumart when album itself has no info

1.0.7
- [Fixed] Pagination in playlist and genre views
- [Fixed] Track type missing in player state

1.0.6
- [Fixed] Wrong seek value reported in 'stop' events ([#6](https://github.com/patrickkfkan/volumio-jellyfin/issues/6))
- [Changed] Use a more descriptive SDK client name (as shown on Jellyfin dashboard)

1.0.5
- [Fixed] Manifest UI detection broken by Volumio commit [db5d61a](https://github.com/volumio/volumio3-backend/commit/db5d61a50dacb60d5132238c7f506f0000f07e07)
- [Fixed] Prefetch skipping track when disabled or failed

1.0.4
- [Added] Obtain favorite status of songs from server; mark / unmark favorite songs alongside Volumio

1.0.3
- [Fixed] Regression with playback of legacy URIs (pre-1.0) stored in Volumio playlists
- [Fixed] Extra query string param added to image URL of songs
- [Fixed] Goto function crashing Volumio
- [Changed] Show albums by artist in separate 'Albums' and 'Appears On' sections
- [Changed] Only search once per user/server pair (where server URL is different for each pair but points to the same server)
- [Added] 'More like this' section in album view

1.0.2
- [Fixed] Login err when server config contains different URLs pointing to same server
- [Fixed] Login err when server is removed, followed by adding it back
- [Changed] Only show one entry on landing page per user/server pair (where server URL is different for each pair but points to the same server)

1.0.1
- [Changed] More checks in validating 'Add Server' input
- [Fixed] Miscellaneous login issues

1.0.0
- [Changed] Rewrite in Typescript and use Jellyfin SDK for API calls
- [Added] Support for multiple user accounts on same Jellyfin server
- [Added] Gapless playback
- [Added] Report playback state to Jellyfin server

0.1.8
- [Added] Folder View support

0.1.7:
- [Fixed] Playlist items not appearing in correct order
- [Fixed] UnhandledPromiseRejectionWarnings thrown during authentication (supposedly fixed in prev version, but in fact wasn't)

0.1.6:
- [Fixed] Regression in marking songs as played
- [Fixed] Support for 'localhost' server URL

0.1.5:
- [Fixed] Adding current song to playlist / favorites in Playback view
- [Added] Goto album / artist
- [Changed] Use plain text titles if Manifest UI is enabled

0.1.4:
- [Changed] Clean up install script

0.1.3:
- [Changed] Minor change to loading of translations
- [Changed] Update plugin for Volumio 3

0.1.3-a:
- [Added] Collections support
- [Fixed] Wrong selections showing in filter views
- [Changed] Minor UI changes

0.1.2-a:
- [Added] 'Random' sort option in All Songs
- [Changed] Apply filters when playing top-level folders (e.g. clicking Play button on 'Albums' and 'All Songs')
- [Fixed] Next Page URIs exploded, resulting in extra songs added to queue
- [Changed]: Use semantic versioning from now on

0.1.1b-20210905:
- [Added] Filters
- [Changed] Miscellaneous UI changes

0.1.0b-20201222:
- [Fixed] Volumio playlist items added from queue cannot be played

0.1.0b
- Initial release
