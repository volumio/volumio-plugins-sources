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

### What are the localization settings for?

'Geographic Coordinates' are used by the Weather Service to display location-specific weather information in the Weather Dock Component and on the Idle Screen*.

'Locale' determines how dates and times are displayed. E.g. for numeric date formats, 'English (United States)' will display the month before the day ('4/18/2022'), whereas 'English (United Kingdom)' will display the day first ('18/4/2022').

'Timezone' determines what date and time should be displayed in the Clock Dock Component and on the Idle Screen. If you have provided Geographic Coordinates, you can simply set this to 'Match Geographic Coordinates' - the plugin will determine the timezone based on the specified coordinates.

*Display of weather information is optional. Note that to display weather, you also need to provide an OpenWeatherMap API key in the 'Weather Service' section of the plugin settings.

## Technical Notes

Starting from version 0.2.0, the web client and preview page are implemented in ReactJS for better code maintainability. This repo only contains the production build for these components (under `/app/client/build` and `/app/preview/build` respectively). You can access their sources here:

- [Web client](https://github.com/patrickkfkan/volumio-now-playing-reactjs-client)
- [Preview page](https://github.com/patrickkfkan/volumio-now-playing-reactjs-preview)

## Changelog

0.3.6
- Add option to hide volume slider in Action Panel
- Change default value of idle screen weather icon animation to "OFF" since animating icons can be resource-heavy
- Add metadata font settings
- Add hourly data to info returned by weather service
- Some minor bug fixes
- Update web client v0.2.4

0.3.5
- Update web client v0.2.3

0.3.4
- Add option to show volume bar when docked volume indicator is clicked
- Implemented config update logic
- Update web client v0.2.2

0.3.3
- Yet another version just to work around the limitations of Volumio plugin submission. This version moves the `geo-tz` node module to `install.sh`, thereby reducing the size of the installation package.

0.3.2
- This version is solely for the purpose of resubmitting to the Volumio plugin store. The code is exactly the same as v0.3.1. Version incremented only due to omission in deleting node_modules and package-lock.json left over from previous `volumio plugin submit`, resulting in node modules not being updated in the installation package that was uploaded to Volumio store. This means v0.3.1 from the Volumio store is broken and will fail to start. You should install v0.3.2 instead.

0.3.1
- Fix bug with empty performance settings causing client to crash on startup
- Update web client v0.2.1

0.3.0
- Add localization settings
- Add weather service
- Add Idle Screen
- Add Dock Components:
  - Action Panel trigger
  - Volume Indicator (replaces Volume Indicator Tweaks)
  - Clock
  - Weather
- Add seek time font size and color settings
- Update web client: v0.2.0

Note: due to changes in the config data schema, style customizations you made in previous versions will be lost, so you would have to reconfigure them after updating. A config updater is *planned* for future releases to provide automatic config migration across version updates.

0.2.3
- Add following settings:
  - Track info display order
  - Album art border
  - Background overlay gradients
  - Additional Volume Indicator Tweaks
- Update web client: v0.1.2

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