# IR Activity LED Indicator

- This plugin can indicate IR remote control activity by blinking an LED.
- Works with ir_controller plugin, but should work OK with other LIRC installations as well.
- Any decoded IR command triggers blinking.
- LED choices supported: GPIO, PWR, ACT. 
	- GPIO: LED connected to any available GPIO. 
	- PWR: red built-in LED found on RPi boards indicating power by default.
	- ACT: yellow built-in LED found on RPi boards indicating SD card activity by default.
- Built-in LEDs retain their default function after blinking is complete. 
- GPIO LED takes GPIO state at the start of the blinking as default state.
- Blink rate and number of cycles are adjustable.
- Tested on Raspberry Pi 4 B.
- Intended for Volumio players with no display.
