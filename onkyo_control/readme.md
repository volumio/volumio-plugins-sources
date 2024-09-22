#       Volumio Onkyo Control Plugin

(Hopefully) A simple plugin that is able to turn an Onkyo receiver on the network on and off when playback begins and ends using eISCP.

https://github.com/tillbaks/node-eiscp

## Features

- Automatically or manually detect compatible Onkyo receivers on the network .
- Send a power on or power off command to an Onkyo receiver when Volumio playback begins or ends.
    - Pausing is equivilant to stopping a song.
- Select the zone you want to listen on.
- Set the volume on the receiver to a set value when Volumio playback begins.
    - This also sets volumio's volume
- Set receiver volume using Volumio's volume controls
- Delay the power off command to the receiver (to allow for pausing music without shutting down).
    - If a song starts playing again before the delayed power off kicks in, it will prevent the receiver from turning off.

## Refactor enhancements
Numerous enhancements have been made as of a major refactor done in 2022 by Hendrix04.
I would like to thank Ben Mitchell (orderpftheflame) for giving a great base for me to start with.
Had it not been for this plugin, I likely would have never picked up Volumio.

- Updated to be compatible with the Volumio 3 pluigin store
- Updated receiver information so that more receivers are compatible
- Zone selection
- More intelligent configuration page.
    - Selecting a reciever and saving the Connection Configuration will populate the zone dropdown with appropriate zones.
- Better volume support
    - Max volume setting
    - Volumio's volume is now appropriately relayed to the receiver.
        - Example: The Spotify Connect plugin will now enable the Spotify app to control the reciever volume.
- Better handling of power off
    - Power off is now triggered via pause or stop
    - If music is started back up after a pause or stop, but before the receiver is turned off (aka before the off delay runs out), then the reveiver will stay on.

## Installation

The latest released version is available for installation through the Volumio Plugins UI.

## Manual Installation of latest dev version

1. Enable SSH following the instructions found here:
```
https://volumio.github.io/docs/User_Manual/SSH.html
```
2. Connect via ssh using putty or the command line ```ssh volumio@volumio.local```
3. Download and install the plugin using the following commands:
```
git clone https://github.com/hendrix04/volumio-plugins-sources.git
cd volumio-plugins/plugins/system_hardware/onkyo_control
npm install
volumio plugin install
```
## Settings
##### Connection Configuration
- Automatically Discover Receiver
    - Automatically use the first receiver on the network. If you have more than one receiver or your receiver is not automatically found, you may wish disable this and pick from the dropdown.
- Select Receiver
    - Pick your target receiver from the list of those found on the network, or select 'Manual entry' to define your IP and Port.
- Manual IP/Hostname
    - The IP or hostname of the Onkyo receiver you wish to control.
- Port
    - The Port you wish to control the receiver with.
- Receiver Model (Optional)
    - The model of receiver. This may be required with old receivers that do not support automatic discovery.
##### Action Configuration
- Zone Selection
    - Select which zone to power on
- Power On
    - Power on the receiver when playback begins.
- Maximum Volume
    - Ensure that the reveiver never gets a command to go over a specific volume level.
- Set Volume On Play
    - Set the volume of the receiver on playback start.
- Volume Value
    - The value to set the volume to on the receiver.
- Set Input Channel on Play
    - Set the input channel of the receiver on playback start.
- Input Channel Value
    - The input channel to change to on the receiver. Some channels may not be available on your receiver.
- Standby On Stop
    - Put the receiver into the standby state when playback ends.
- Standby Delay Time (Seconds)
    - The time (in seconds) to wait before putting the receiver in a standby state. If playback is resumed within this time, this command is cancelled.


![Alt text](settings.png?raw=true "Settings and configuration")

## TODO
There is nothing currently on the todo list. If someone has any suggestions, please [open an issue](https://github.com/hendrix04/volumio-plugins-sources/issues).

One of the original TODO items was to limit the input selection list based on receiver. This is not possible with current data.
If someone wants to go through the effort of creating a mapping for all known receivers, I would be happy to incorporate it.
