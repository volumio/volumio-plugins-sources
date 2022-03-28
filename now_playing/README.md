# Now Playing Plugin for Volumio

This plugin provides a 'Now Playing' screen for your Volumio device. It is intended for displays that are mainly used to show what Volumio is playing, as opposed to doing things such as browsing media. This makes the plugin suitable for embedded displays that are generally limited in screen estate.

This repository has two branches:

1. The `master` branch is targeted towards Volumio 3.
2. The `volumio-2.x` branch is targeted towards Volumio 2.x.

The focus is on the `master` branch. The `volumio-2.x` branch will only be maintained if it is practically feasible and still worthwhile to do so.

## Showing the Now Playing screen on connected display

First, you need to make sure that your display is able to show Volumio's default interface. This plugin does not deal with the hardware setup part.

Then, go to the plugin settings and click the 'Set to Now Playing' button in the 'Volumio Kiosk (Local Display)' section.

## Customizing the Now Playing screen

Certain aspects of the screen, such as album art size and text colors, can be customized in the plugin settings (knowledge of CSS will help).

Saved changes are applied on the fly &mdash; there is no need to refresh the Now Playing screen.

## Action Panel

Tap the down arrow at the top of the Now Playing screen (or swipe down from top) to reveal the Action Panel. Here, you can:

- Change volume
- Switch to one of the extra screens

## Extra screens

Apart from the Now Playing screen, the plugin also provides the following screens:

### Browse screen

Browse your music library or access a music service.

To access:

- Tap the Browse icon in the Action Panel; or
- Swipe left or right in the opposite area of the Now Playing screen.

### Queue

To access:

- Tap the Queue icon in the Action Panel; or
- Swipe up from the bottom of the screen.

### Volumio screen

Shows the default Volumio interface.

To access, tap the Volumio icon in the Action Panel.

## Q&A

### How do I set my own background image?

First, go to *Volumio* Settings -> Appearance. Under 'Theme Settings', upload the image you want to use as the Now Playing screen background.

Then go to the plugin settings. In the Background section, choose 'Volumio Background' for Background Type. Then select the file you have uploaded from the Image dropdown list.

### What is 'Now Playing URL' and 'Preview URL' in the plugin settings?

The Now Playing screen is a web page that can be accessed directly through the Now Playing URL. The idea is that you can have the screen displayed not only on your Volumio device, but also in a web browser or UI component that can display web content (e.g. WebView).

The 'Preview URL' points to the preview page. Click the 'Open Preview' button to quickly open this URL. On the preview page, you will see the Now Playing screen inside a frame that can be adjusted to match the resolution of your Volumio device's display (or you can choose from one of the presets). This way, even if your Volumio device is away from you, you can still see any customizations you make in the plugin settings.

## Technical Notes

Starting from version 0.2.0, the web client and preview page are implemented in ReactJS for better code maintainability. This repo only contains the production build for these components (under `/app/client/build` and `/app/preview/build` respectively). You can access their sources here:

- [Web client](https://github.com/patrickkfkan/volumio-now-playing-reactjs-client)
- [Preview page](https://github.com/patrickkfkan/volumio-now-playing-reactjs-preview)

## Changelog

0.2.2
- Update preview page: v0.1.2

0.2.1
- Add metadata service
- Add performance settings
- Update web client: v0.1.1

0.2.0
- Migrate to ReactJS implementation for web client and preview page (see Technical Notes for more info)
    - Web client: v0.1.0
    - Preview page: v0.1.0

0.1.4
- Add option to display volume level on Now Playing screen (enable in plugin settings -> Volume Indicator Tweaks)
- Add early preview of extra screens (Browse Music and Queue)
- Fix buttons not working in action panel if mixer is set to 'None'
- Miscellaneous UI changes

0.1.3
- Add widget margins setting
- Code changes relating to use of CSS variables

0.1.2
- Use colorpicker for color settings
- Add "Show Album Art" option to Album Art settings
- Add "Margins", "Alignment (Vertical)" and "Max Lines" options to Text Style settings
- Add external volume change indicator 

0.1.1
- Update plugin for Volumio 3 (note the change of category to 'user_interface')
- Some minor code changes

0.1.0
- Add 'View Readme' button to plugin settings

0.1.0-b.5
- Back up Volumio Kiosk script before modifying it to show the Now Playing screen; add 'Restore from Backup' button as failsafe measure.

0.1.0-b.4
- Add 'Broadcast Refresh Command' button to plugin settings
- Auto reload Now Playing screen on change in plugin version or daemon port
- Show overlay when socket is disconnected

0.1.0-b.3
- Add border-radius setting to album art

0.1.0-b.2
- Fix album art appearing as dot in FireFox

0.1.0-b.1
- Initial release

## License

MIT