You are currently on the **Volumio BUSTER** version of this plugin. 
<br>
If you need to use this repository after mid-2025, you may be looking for the [Volumio BOOKWORM](https://github.com/audiophonics/volumio-plugins-sources-bookworm) version instead.
<br>
To clafiry the version you are currently using, run ```lsb_release -a``` into a SSH session and confirm whether your Pi is running Buster or Bookworm. 

<hr>


## Evo Sabre as a Volumio 3 Plugin VERSION 2.

This plugin has two main purposes : 
* Installing the EVO-Sabre secondary OLED display (rightmost display) to work with Volumio playback system.
* It also installs and configures the remote control receiver to work alongside Volumio playback control.

### Installation 
A step-by-step installation guide on this page [is available here](https://www.audiophonics.fr/en/blog-diy-audio/40-new-installation-system-for-evo-sabre-under-volumio-plugin.html).


### Display Layer : 

The Oled#2 layer is a separate nodejs application launched when the plugin starts. The run command is exposed as a service (evo_oled2.service) and triggered with systemctl.  
  
It uses websocket to address the [Volumio Websocket API](https://volumio.github.io/docs/API/WebSocket_APIs.html) and fetch the streamer inner state.  
  
It also uses a micro http server to listen to many events as a way to detect activity (mainly to automatically exit sleep mode when the remote is used).  
  
The SPI driver is no longer handled with [RPIO](https://www.npmjs.com/package/rpio), but now uses [spi-device](https://github.com/fivdi/spi-device) to align with Volumio need to support newer versions of Raspberry Pi 5 and kernel-agnostic GPIO addressing. 
This change means the installer has to write in ```/boot/userconfig.txt``` to enable hardware spi device. Because of this, the display now also needs a reboot after the first install.
    
### Remote Layer :

The remote layer uses the regular LIRC & IREXEC to translate IR inputs as system calls. Both processes are bound in separate services with arbitrary names (evo_remote.service & evo_irexec.service) to avoid collision with other plugins using a remote.
  
During plugin installation, the installer writes in ```/boot/userconfig.txt``` to expose the gpio-ir device tree with the correct pin-out. Because of this, a reboot is required after a first install to have remote is 100% working.
	
 ## Translation & documentation
 The plugin settings page provides some documentation and tips to help the user configuring Volumio for a Evo Sabre (mainly audio output selection). All is available in French and English. Anyone willing to help with other languages is more than welcome.
 
   
   
 ## Credits 
Many thanks to Nerd, Gé & Balbuze for pointing me to the right documentation and providing me with precious advice while I was writing and updating this plugin.
Also a special thank you to Jens Neugebauer for thoroughly testing the plugin and helping me gaining enough confidence to port this whole set of software as a plugin.
Thanks to the many Evo Sabre user that were patient enough to provide feedback for the first beta version.
 
