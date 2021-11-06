# IR Remote Controller plugin

The plugin installs LIRC and allows to control functions of Volumio from a remote control.

## Selecting a remote control
On the plugin's configuration page different remote controls are offered to be chosen from a selection list.

Usually depending on the available keys of a particular remote typically (but not always) "play", "pause", "mute", "volume", "next", "previous", "seek", "repeat" and "random" can be controlled remotely.

User-specific configurations for remote controls can be stored in a dedicated folder named “/data/INTERNAL/ir_controller/configurations”. A subfolder must be created in the aforementioned directory for each remote control, in which the LIRC files “lircrc” and “lirc.conf” are stored for the remote control.

The name of the subfolder appears in the list of selectable remote controls. If this name is also used for one of the remote control configurations already supplied, the user’s own configuration with the same name takes precedence.

**Note:** Updating the plugin does not affect the user-defined configurations. However, when the plugin is uninstalled, the “/data/INTERNAL/ir_controller” directory is deleted along with all the subfolders and files it contains.

## Setting the GPIO for the IR Receiver
The plugin allows to set the number of the GPIO port to be used by the IR receiver. Also the "pull-up/pull-down" state and the "active-high/-low" logic of the chosen GPIO can be set.

The GPIO port related options are not available if an IR receiver has already been registered to the device tree. In that case no configuration of the IR receiver's GPIO port should be necessary.
