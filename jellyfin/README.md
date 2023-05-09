# Jellyfin plugin for Volumio

Volumio plugin for playing audio from one or more [Jellyfin](https://jellyfin.org/) servers. It has been tested with Jellyfin 10.8.3.

#### Adding a Jellyfin Server

A Jellyfin server can be on the same network as your Volumio device, or it can be remote (of course, you would have to configure the server so that it is accessible from the Internet). You can add a server in the "Add a Server" section of the plugin settings.


*Make sure you provide the full server address. "http://www.myjellyfinserver.com:8096" would be a valid example, but leaving out the "http://" will render it invalid.*

You can add multiple servers, each with multple user accounts, and those that are reachable will appear on the plugin landing page.

#### Notes

- Audio is served through Direct Streaming. This means when you play a song, it will be streamed to Volumio in its original format without any modifications. This gives you the highest sound quality possible but, if you are streaming from a remote server, then you should consider whether your Internet connection has sufficient bandwidth to handle the traffic.

#### Changelog

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
