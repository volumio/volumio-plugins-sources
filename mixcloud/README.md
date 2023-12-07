# Mixcloud plugin for Volumio

Volumio plugin for playing Mixcloud shows.

*This plugin is not affiliated with Mixcloud whatsoever.*

## Limitations

- Mixcloud login is not supported. This means you will not be able to access exclusive content or account-specific features.
- This plugin does **not** fetch data through an official API. Any changes on Mixcloud's end has the potential to break the plugin.

## Support Mixcloud and Content Creators

The purpose of this plugin is to allow you to discover shows and content creators on Mixcloud through Volumio. If you come across something that you like, consider subscribing to the creator. For convenience sake, the plugin displays links for viewing shows and users on the Mixcloud website (Volumio Contemporary / Classic UI only). You can also access the creator of a currently playing show through the menu in Volumio's player view / trackbar (click the ellipsis icon to bring up the menu).

## Changelog

1.0.1
- Fix live stream pagination

1.0.0
- Rewrite in TypeScript
- Add live stream support

0.1.3
- Fix fetch errors due to Mixcloud changes.

0.1.2
- Fix Manifest UI detection broken by Volumio commit [db5d61a](https://github.com/volumio/volumio3-backend/commit/db5d61a50dacb60d5132238c7f506f0000f07e07)

0.1.1
- Fixed adding current track to playlist / favorites in Playback view
- Because of fix above, track info now shows bitrate (where it can be obtained) instead of bit depth and sample rate
- If Manifest UI is enabled, titles will be shown in plain text without formatting and links

0.1.0
- Minor change to loading of translations
- Update plugin for Volumio 3

0.1.0a-20210310
- Avoid cut-offs at ~10 minutes into playback due to buggy MPD in Volumio

0.1.0a
- Initial release
