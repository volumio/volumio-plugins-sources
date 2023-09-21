# RemotePi plugin

The plugin enables support for MSL Digital Solutions' RemotePi boards for Raspberry Pi 4, Pi 3 B+, Pi 3, Pi 2, B+ and B on Volumio.

## Shutdown and cutting power
After activating the plugin the RemotePi board will get signaled as soon as Volumio is shut down via the GUI.
This allows the RemotePi board to cut power from the RasPi after the shutdown process has finished.

Furthermore the plugin detects the signal that is sent by the RemotePi board in case its hardware knob has been pressed or an IR power off signal from a remote control has been received. The plugin then initiates the shutdown of Volumio and sends a signal back to the RemotePi. This allows the board to detect when Volumio’s shutdown process has finished and cut the power afterwards.

## Set up IR receiver for LIRC
The plugin configures Volumio to load the necessary overlay for the IR receiver of the RemotePi board. This behaviour can be switched off. By default the plugin uses GPIO18 for the IR receiver. But as the hardware of RemotePi boards can be modified to use GPIO17 instead the plugin allows to set up the configuration accordingly.

**Note: The plugin will not install and setup LIRC!** This can be achieved by installing the IR Remote Controller plugin.
