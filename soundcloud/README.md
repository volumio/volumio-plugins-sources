# SoundCloud plugin for Volumio

Volumio plugin for browsing and playing SoundCloud content.

### Playback

The plugin uses [MPD](https://www.musicpd.org/) for playing a SoundCloud track, which can be in one or more of the following formats:

1. MPEG Audio (Progressive)
2. Ogg Opus (HLS)
3. MPEG Audio (HLS)

(These formats are revealed through inspecting the metadata of various SoundCloud tracks and may not be conclusive)

When playing a track, the plugin always looks for "MPEG Audio (Progressive)" first, then "Ogg Opus (HLS)". These two formats play just fine on Volumio 3.

The last format, "MPEG Audio (HLS)", is somewhat problematic. While the stream will still play, playback will terminate if you try to seek.

>It appears that tracks that do not have "MPEG Audio (Progressive)" formats do have "Ogg Opus (HLS)". The chance of encountering an "MPEG Audio (HLS)" format should in fact be quite small.

### Supporting SoundCloud and Artists

If you come across an album that you like, consider purchasing it to support the SoundCloud platform and its artists. The plugin displays links where applicable so you can follow them to the corresponding SoundCloud pages (note: links not available if Manifest UI is enabled).

### Changelog

1.0.3
- Fix longer tracks cutting off early at 30-40 minutes into playback

1.0.2
- Fix plugin crash due to error in obtaining SoundCloud client ID

1.0.1
- Add library item filter
- Minor UI changes and bug fixes

1.0.0
- Migrate to TypeScript
- Add support for access to private resources through access token

0.1.5
- [Fixed] Manifest UI detection broken by Volumio commit [db5d61a](https://github.com/volumio/volumio3-backend/commit/db5d61a50dacb60d5132238c7f506f0000f07e07)

0.1.4
- [Fixed] Adding current song to playlist / favorites in Playback view
- [Changed] Because of fix above, track info now shows bitrate instead of bit depth and sample rate
- [Added] Go To Album / Artist*
- [Changed] Use plain text titles if Manifest UI is enabled

*&nbsp;Go To Album has the following behavior:
- Shows the album or playlist (non-system type) from which current track was originally selected; or
- Shows the track's artist, if the track was not selected from an album or playlist

0.1.3
- [Fixed] Translations

0.1.2
- [Changed] Minor change to loading of translations

0.1.1
- [Changed] Update plugin for Volumio 3

0.1.0a-20210103
- [Change] Update soundcloud-fetch module (fixes track ordering)
- [Fix] Strip newline characters from MPD tags that could cause error

0.1.0a
- Initial release
