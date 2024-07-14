# Touch Display plugin

**NOTE: The plugin cannot be installed on systems that have a factory option to display Volumio's UI via HDMI video output.**

The plugin enables the display of Volumio's UI on locally connected screens. If the screen offers touch control, apart from keyboard input the UI can be operated from the screen. The plugin focuses on the original Raspberry Pi Foundation 7" display (and compatible DSI displays), but can in principle also be used with displays connected via HDMI or GPIO. However, HDMI and GPIO displays may require additional action by the user, depending on the type of display and any touch controller present, and **requiring advanced knowledge**.

The following features are available on the plugin’s configuration page (other screens than the the original Raspberry Pi Foundation display may not have all of them available):

## Screen saver
The options allow setting the timeout in seconds until the screen saver (DPMS state “off”) gets invoked. A value of 0 disables the screen saver.
Furthermore it is possible to block the screen saver as long as Volumio is in playing state.

## Screen brightness
For displays where a backlight interface is detected the screen brightness can be set. If the current screen brightness should be above 14 and then set to a value below 15 a modal shows up to warn for a very dark screen. The modal offers to test the new (low) value by applying it for 5 seconds before the previous brightness gets restored. After that the user can decide if the new or the previous setting should be kept.

It is possible to define two different brightness values ("brightness 1" and "brightness 2") and to specify the time of day at which each brightness value should be set (e.g. a higher brightness value in the daytime starting at 6:00 and a lower brightness at the night-time starting at 21:00). The time of day values need to follow the 24-hour clock system and the time format hh:mm. If both time of day settings should be identical, the screen brightness will not be changed but only brightness 1 will be applied. Regarding the time values be aware that the plugin uses the system time. The system time might deviate from the local time and can only be changed from the command line currently.

The plugin is also prepared for automatic brightness regulation. The option to use automatic brightness regulation will only show up on the plugin’s configuration page if a file named "/etc/als" exists.

Obviously automatic brightness requires additional hardware in the shape of an ambient light sensor. This is typically an LDR with a voltage divider connected to an ADC like the TI ADS1115. For example on a Raspberry Pi if the LDR would be connected to input AIN0 of an ADS1115 measuring single-ended signals in continuous conversion mode the current converted LDR value would appear in "/sys/devices/platform/soc/fe804000.i2c/i2c-1/1-0048/iio:device0/in_voltage0_raw". This file would need to be symlinked to "/etc/als" as the plugin awaits the current value of an ambient light sensor in "/etc/als".

When automatic brightness gets enabled for the first time the light sensor obligatorily has to be “calibrated” according to minimum and maximum screen brightness. The calibration process consists of measuring the ambient light in a first setting (e.g. darkness or twilight) where the lowest screen brightness should be reached and a second setting (e.g. “normal” daylight or bright sunshine) where the highest screen brightness should be reached. Through a dedicated button the calibration process can be repeated anytime if needed. The range of possible screen brightness values can be adjusted through the minimum and maximum screen brightness settings.

Furthermore when using automatic brightness it is possible to define a third “reference” point to form a brightness curve between minimum and maximum screen brightness reaching a “reference” screen brightness at a certain ambient brightness. This can be useful if the progression of screen brightness in accordance to ambient brightness needs to be slowed down or accelerated.

## Display orientation
The display can be rotated in 90° steps. The touch direction is rotated accordingly to the display. Depending on the screen additional action might be necessary if ex-factory the X- and/or Y-axis should be inverted and/or the touch function should not be aligned to the display. As there are a lot of different screens in the market with a lot of different ex-factory settings, the plugin does not take care for these partially weird deviations from a screen with display and touch equally rotated and aligned.

When the display orientation setting is changed a modal may show up to inform about a reboot is required. The user has the option to initiate the reboot or proceed (and reboot later).

## GPU memory
On Raspberry Pis but Pi 5 the plugin can control the amount of memory used by the GPU. This setting had been introduced, because rotating the display by 90° or 270° on a screen with higher resolution requires more GPU memory than 32MB which is the default setting of Volumio on devices with total RAM of only 512MB or less. E.g. for a screen with a resolution of 1980x1080 pixels a GPU memory of 34MB has to be set or the screen will stay black.

The size of the GPU memory can be adjusted in steps of 1MB in a range from 32 to 512MB. According to the Raspberry Pi Documentation the recommended maximum values for GPU memory are 128MB if total RAM is 256MB, 384MB if total RAM is 512MB, 512MB if total RAM is 1024MB or greater and 76MB on the Raspberry Pi 4. It is possible to set to larger values for GPU memory than the recommended ones, however this can cause problems, such as preventing the system from booting.

**NOTE: The plugin will not check if the set value is sensible or even exceeds the amount of total RAM!**

## Show/hide mouse pointer
Self explanatory. By default the mouse pointer is hidden.

## Virtual keyboard
A virtual keyboard can be displayed which is especially useful to control Volumio's UI from a touchscreen. By default the virtual keyboard is inactive.
