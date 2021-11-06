# YouTube Cast Receiver for Volumio

A plugin that enables Volumio to act as a cast device for the YouTube mobile app or website. The plugin will playback the audio streams of videos casted to it.

>Not all browsers support casting from the YouTube website. The plugin has been tested to work with the Chrome and Edge desktop browsers.

This repository has two branches:

1. The `master` branch is targeted towards Volumio 3.
2. The `volumio-2.x` branch is targeted towards Volumio 2.x.

The focus is on the `master` branch. The `volumio-2.x` branch will only be maintained if it is practically feasible and still worthwhile to do so.

## Getting Started

To begin casting:

1. Ensure your phone or computer is on the same network as your Volumio device.
2. Select the Cast button in the YouTube mobile app or website.
3. Choose your Volumio device.
4. Select a video or playlist for playback. Volumio should now play it.
5. Control playback through the mobile app or website.

# Notes

- Only public videos can be played. Private (even owned by you) and regionally restricted videos will fail to load.
- The YouTube website is less featured than the YouTube mobile app as far as casting is concerned:
    - Autoplay is not supported
    - Videos added manually to the queue are not visible to the plugin, and so will not be played.
- The plugin tries to keep connections alive, even when nothing is being casted. Despite so, a connected client (YouTube app or website) may still decide to disconnect.
- This plugin is work-in-progress. Do not expect it to be bug-free. If you come across an issue, you can report it on Github or in the [Volumio forums](https://community.volumio.org/). The latter is preferred because more people will see it and can report their findings too.


# Changelog

0.1.1
- Check audio URLs and refetch on error response (retry up to 5 times)
- Minor change to loading of translations
- Update plugin for Volumio 3

0.1.0-b
- Version change to mark update of yt-cast-receiver module to version 0.1.1-b

0.1.0a-20210627
- Adapt to YouTube changes
- Really fix compatibility with Volumio 2.x
- Add 'Bind to Network Interface' setting

0.1.0a-20210620-2
- Fix compatibility with Volumio 2.x

0.1.0a-20210620
- Update yt-cast-receiver module

0.1.0a-20210419
- More robust transition from another service

0.1.0a-20210417
- Add livestream support

0.1.0a
- Initial release
