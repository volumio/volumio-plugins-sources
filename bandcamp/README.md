# Bandcamp Discover for Volumio

Volumio plugin for discovering Bandcamp music.

*This plugin is not affiliated with Bandcamp whatsoever.*

This repository has two branches:

1. The `master` branch is targeted towards Volumio 3.
2. The `volumio-2.x` branch is targeted towards Volumio 2.x.

The focus is on the `master` branch. The `volumio-2.x` branch will only be maintained if it is practically feasible and still worthwhile to do so.

## Limitations

- Bandcamp login is not supported, due to Bandcamp not releasing an API that allows it. This means you will not be able to access your purchases nor stream high-quality music from Bandcamp.
- This plugin scrapes content from the Bandcamp website. If Bandcamp changes their site, then this plugin may no longer work until it is updated to match those changes. Furthermore, loading of some resources could take a while if the plugin has to gather data from multiple pages.

## Support Bandcamp and Artists

As the name implies, the purpose of this plugin is to allow you to discover music and artists on Bandcamp through Volumio. If you come across something you like, consider purchasing it on the Bandcamp website. To this end, the plugin displays links for accessing albums, artists and labels on Bandcamp. You can also access the album or artist of a currently playing Bandcamp track through the menu in Volumio's player view (click the ellipsis icon to bring up the menu).

## Changelog

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
