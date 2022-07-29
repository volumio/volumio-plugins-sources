#	VOLUMIO MPD OLED

- This plugin was designed to provide an easy way to install and configure the popular `mpd_oled` project.  You can now fully customise your display without having to go to the command line!

- The `mpd_oled` program displays an information screen including a music frequency spectrum on an OLED screen connected to a Raspberry Pi (or similar) running MPD, this includes Moode, Volumio and RuneAudio. The program supports I2C and SPI 128x64 OLED displays with an SSD1306, SSD1309, SH1106 or SSH1106 controller. 

[Click here to visit the mpd_oled project on GitHub](https://github.com/antiprism/mpd_oled)

![I2C OLED in action](images/oled.jpg?raw=true "I2C OLED in action")

![Plugin Screenshot 1](images/screenshot1.png?raw=true "Plugin Screenshot 1")

![Plugin Screenshot 2](images/screenshot2.png?raw=true "Plugin Screenshot 2")

## How to install

- I have included instructions for downloading, installing and updating the plugin in this document, but  it is envisaged that the plugin will become part of the Volumio plugin store and these manual steps will not be required.

### 1. Connect your OLED display to your device

- The small OLED displays intended for this setup are normally controlled via I2C or SPI.  I2C is the easiest type of screen to hook up with only 4 pins: power, gnd, SDA and SCL.

- You can hook up your screens like so:

![I2C wiring](https://github.com/antiprism/mpd_oled/blob/master/doc/wiring_i2c.png?raw=true)

![SPI wiring](https://github.com/antiprism/mpd_oled/blob/master/doc/wiring_spi.png?raw=true)

### 2. Enable SSH and connect to Volumio

- To do that, have a look here:

https://volumio.github.io/docs/User_Manual/SSH.html


### 2. Download and install the plugin

**Hopefully the plugin will appear in the Volumio plugin store soon and these steps won't be required...**

- This process takes a few minutes on a Pi4 and much longer on a Pi0.
- Type the following commands to download and compile the depencies and install the plugin:  

**When you run the `volumio plugin install` command and it will output finalizing installation.  You will need to press `Ctrl + C` to finish the process.**

```
wget https://github.com/supercrab/volumio-plugins/raw/master/plugins/miscellanea/mpd_oled/mpd_oled.zip
mkdir ./mop
miniunzip mpd_oled.zip -d ./mop
cd ./mop
volumio plugin install
volumio vrestart
cd ..
rm -Rf mop
rm -Rf mpd_oled.zip
```

### 3. Enable the plugin

- In the Volumio web UI, go to the plugin section and enable it!


### 4. Configure the plugin

- You will need to first select the type of OLED you have from the `OLED Display Type` drop down.  If you are not sure you can try selecting each type on by one and clicking the `Save` button.

- If you have an I2C OLED and the default option for the `I2C Address` dropdown does not update your display then see the section below.

- If you have an SPI OLED make sure the SPI reset, SPI DC, SPI CS dropdowns all match your hardware connections.

### 5. I2C Device Scan

- If you have an I2C OLED display then you can check it is wired up correctly by clicking the `I2C Device Scan` button.  This will return the addresses of any devices attached to the I2C busses.  If it finds a device then be sure to set the `I2C Address` and `I2C Bus` drop downs to match the findings and click the `Save` button.  

- If you have other I2C devices connected (that are not currently used by a driver) they will also be listed.  It is not possible to tell which devices are displays, so if multiple devices do appear in the scan, try setting the `I2C address` and `I2C Bus` drop downs for each device and click the `Save` button until you find a setting that works. 

- Note: if you have a new setup and your I2C screen is not found, reboot your system and try again.

- Note: if you have HiFiBerry or similar DAC attached, it might not appear in the I2C scan because it's in use.

### 6. Plugin Upgrade

- If you have the plugin installed and would like to update it then, please use the following commands:  

```
wget https://github.com/supercrab/volumio-plugins/raw/master/plugins/miscellanea/mpd_oled/mpd_oled.zip
mkdir ./mop
miniunzip mpd_oled.zip -d ./mop
cd ./mop
volumio plugin refresh && volumio vrestart
cd ..
rm -Rf mop
rm -Rf mpd_oled.zip
```

## Tested on

* Raspberry Pi 3 B+
* Raspberry Pi Zero 


## Available languages

* English (en)
* Slovakian (sk)
* Spanish (es)
* German (de)
* Italian (it)
* Dutch (nl)


## Latest changes

26th Feb 2021

- Added code to kill any orphaned CAVA processes that might hold on to a reference to an audio input device
- Plugin will only run mpd_oled using sudo if an SPI display has been selected

25th Feb 2021

- Fixed date format label typo in consig.json

23rd Feb 2021

- Allow `mpd_oled` to run with root privilages to allow SPI devices to run

15th Feb 2021

- Updated version number
- Changed install.sh to point to a new branch of `mpd_oled` whilst the author makes potential breaking changes
- Added ability to change the date format
- Manually updated translations

14th Feb 2021

- Fix install.sh for building mpd_oled on buster
- Italian translation added

12th Feb 2021

- German translation added

11th Feb 2021

- Updated readme.md
- Spanish translation
- Fixed issue where the 12h clock option did not work

9th Feb 2021

- Initial upload for testing

3rd Feb 2022

- Initial version for Volumio 3


## To do

- If you are able to kindly help with translation to other languages, then here is the file to translate.  Simply send me the file.  <https://github.com/supercrab/volumio-plugins/blob/master/plugins/miscellanea/mpd_oled/i18n/strings_en.json>


## Credits

- Thanks to Adrian Rossiter for help creating the install & uninstall scripts, testing, providing the Spanish translation and for writing `mpd_oled` in the first place: <https://github.com/antiprism>

- `mpd_oled` is the application that does all the hard work.  It communicates with Volumio, reads audio spectrum data from C.A.V.A and displays it on the screen: <https://github.com/antiprism/mpd_oled>

- My Github repository <https://github.com/supercrab>  

- Thanks to misko903 for the Slovakian translation and for giving me the push to write this plugin: <https://github.com/misko903>

- German translation by Josef and Judydudi.

- Italian translation by Pasquale D'Orsi.

- C.A.V.A. is a bar spectrum audio visualizer: <https://github.com/karlstav/cava>

- OLED interface based on ArduiPI_OLED: <https://github.com/hallard/ArduiPi_OLED>
(which is based on the Adafruit_SSD1306, Adafruit_GFX, and bcm2835 library
code).