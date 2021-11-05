# Jellyfin plugin for Volumio

Volumio plugin for playing audio from one or more [Jellyfin](https://jellyfin.org/) servers. It has been tested with Jellyfin 10.6.4 to 10.7.6.

#### Adding a Jellyfin Server

A Jellyfin server can be on the same network as your Volumio device, or it can be remote (of course, you would have to configure the server so that it is accessible from the Internet). You can add a server in the ```Add a Server``` section of the plugin settings.


*Make sure you provide the full server address. "http://www.myjellyfinserver.com:8096" would be a valid example, but leaving out the "http://" will render it invalid.*

You can add multiple servers, and those that are reachable will appear when you click ```Jellyfin``` in the left menu. Choose a server to login and start browsing your music collections. Enjoy!

#### Notes

- Audio is served through Direct Streaming. This means when you play a song, it will be streamed to Volumio in its original format without any modifications. This gives you the highest sound quality possible but, if you are streaming from a remote server, then you should consider whether you have a fast-enough Internet connection with unlimited data.

#### Changelog

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
