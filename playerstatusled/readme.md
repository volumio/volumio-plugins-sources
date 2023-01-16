# Player State LED Indicator

- This plugin can indicate Volumio player state with an LED connected to an available GPIO pin.
- Player states:
	- Stop: LED off. 
	- Play: LED on.
	- Pause: blink LED.
- While Pause is not available in Volumio web UI, it is supported by the API and remote controls.
- Blink rate is adjustable.
- Tested on Raspberry Pi 4 B.
- Intended for Volumio players with no display.
-  This plugin is based on (and inspired by) [supercrab's](https://community.volumio.org/u/supercrab) [gpio_control](https://github.com/volumio/volumio-plugins-sources/tree/master/gpio_control) plugin.
