# Squeezelite MC for Volumio

A plugin that installs and runs Squeezelite with (M)onitoring and (C)ontrol. Aims to work with minimal configuration, displays playback status on Volumio and provides basic player controls (play / pause / next / previous / random / repeat / volume adjust).

Squeezelite is a client player for the Logitech Media Server. The plugin installs the Squeezelite binary obtained from the [LMS Clients](https://sourceforge.net/projects/lmsclients/) repo.

Before installing this plugin, ensure there are no other Squeezelite plugins or binaries installed on the system.

This plugin has been tested to work with Logitech Media Server v8.2.1.

## Getting Started

The following instructions assume you have at least one working Logitech Media Server running on your network.

1. Install the Squeezelite MC plugin from Volumio plugin store.
2. Enable the plugin. Volumio will notify you when Squeezelite has started.
3. Access the web interface of Logitech Media Server. If you have multiple client players on the network, choose the one that shows Volumio's hostname -- this is the default player name assigned to Squeezelite running on Volumio (configurable in the plugin settings).
4. When you play a song, Volumio should display its cover art, title, artist, etc.

## Configuration

The plugin starts Squeezelite with runtime configuration derived from Volumio's "Playback Options" settings. These include:

1. Output Device
2. DSD Playback Mode
3. Mixer Type
4. Mixer Control Name

In the plugin settings, you can configure the following:

1. Player Name (default: device hostname)
2. DSD Playback: playback format to use for DSDs. If set to "Auto" (default), the plugin will determine the format based on Volumio's "DSD Playback Mode" setting. If the plugin fails to determine the correct format, which can happen when DSD Playback Mode is set to "Native", you can manually choose one that your output device supports.
3. Server credentials: for servers that are password-protected.

## Notes

- When Squeezelite starts or needs to be restarted, or when the plugin needs to query the supported DSD Native format for populating Squeezelite's runtime configuration, the output device must not be in use. If the output device is busy at the time, such as when playback is in progress, you will get an error message to that effect. When this happens, you can go to the plugin settings to resolve the error.
- If you try to play a track belonging to another music service at a time when Squeezelite is already playing something, you will likely encounter a "Device or resource busy" error. What happens is, the plugin will tell Squeezelite to stop playback, but there is at least a 1-second delay before the output device is actually released. Since there is no mechanism for the plugin to inform Volumio of this delay, Volumio will just instruct the next music service to start playback immediately. If the output device is still being occupied by Squeezelite (very likely to be the case), then the "Device or resource busy" error will occur. You should therefore pause or stop the Squeezelite playback and wait approximately one second before moving on to another music service.

## Changelog

1.0.4
- Fix: install on RPi 5
- Fix: update ALSA conf on change in mixer type

1.0.3
- Fix proxy: end response on error or invalid URL

1.0.2
- Fix: prevent error in getting suggested startup options from crashing entire config page
- Add 'disable audio fade on resume / pause' option instead of mandatorily disabling it

1.0.1
- Always set LMS Player Settings -> Audio -> Volume Control to 'Output level is fixed at 100%', so that Squeezelite will not incrementally zero-out the volume on pause and incrementally restoring it on resume, as this will cause problems with native DSD playback (noise on play / resume) and also when playing from another Volumio source after pausing Squeezelite playback (volume stays muted).

1.0.0
- Migrate to TypeScript
- Add option to specify full Squeezelite startup options
- Fix Squeezelite not rediscovered after LMS restarts due to change in LMS settings

0.1.2
- Fix sync group status updates
- Fix artist name sometimes empty even if track data has it

0.1.1
- Fix Squeezelite sometimes setting default player name to 'Squeezelite' instead of device hostname
- Fix compatibility with LMS UPnP bridge and similar plugins that create multiple Squeezelite instances on same device
- Other minor bug fixes and improvements

0.1.0
- Initial release

## License

MIT