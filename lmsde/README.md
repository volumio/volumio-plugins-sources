# Logitech Media Server - Docker Edition for Volumio

This plugin installs the [Logitech Media Server](https://www.mysqueezebox.com/) application ("LMS") on your Volumio device. The server runs in a [Docker](https://www.docker.com/) container when the plugin is enabled.

The plugin has been tested on Volumio 3 running on a Raspberry Pi 3b (`armhf` architecture) and x86 PC (`x86_64 / amd64` architecture).

>Devices with ARMv6 processors, such as Raspberry Pi Zero, are NOT supported. Do not attempt installation on such devices.

## Installation

1. Install the plugin through Volumio plugin store. Depending on your hardware and network speed, the installation process can take some time.

2. After installation, enable the plugin. You will be notified when LMS has started.

3. Go to the plugin settings and click the "Open URL" button. This will bring you to the LMS web interface.

    > If you get a Page Not Found error, this could be because the server has not yet fully loaded. Wait a few minutes and try again.

4. Media folders in Volumio are placed inside the server's "music" directory. These include:
    1. INTERNAL: for media stored on Volumio's internal storage
    2. NAS: for media stored on NAS shares added to Volumio
    3. USB: for media stored on USB devices attached to Volumio

    By default, all media in the "music" directory is scanned and added to the music library. You can configure what to include by going to your server's "Basic Settings".

## Client Players

To allow for playback of media hosted on LMS, you need at least one client player running on the same network. In a nutshell:

1. LMS tells a client player what to play;
2. The player plays it on the device it is running on.

You can obtain LMS client players that have been pre-compiled for various operating systems [here](https://sourceforge.net/projects/lmsclients/). If you want to run a client player on your Volumio device (which could also be running LMS), you may consider installing my [Squeezelite MC plugin](https://github.com/patrickkfkan/volumio-squeezelite-mc) instead. That plugin simplifies the setup process and provides some level of integration with Volumio.

## Adding NAS shares, mounting USB devices, etc.

These actions are handled by Volumio. So if you want to add an NAS share, for instance, you would have to go to Volumio's interface and do it in Settings -> Sources.

Basically, the server sees whatever drives and disks Volumio sees. If Volumio fails to recognize a USB device or mount an NAS share, then the server will not be able to access them either.

## FAQ

**On a Raspberry Pi, when I click "View Statistics" in the plugin settings, memory usage is shown as "Unavailable". Why?** 

The memory cgroup is not enabled by default on Raspberry Pi systems. To get memory usage, edit `/boot/cmdline.txt` on Volumio and add the following to the existing list of parameters:

```
cgroup_enable=memory
```

Then reboot your Volumio device.

## Changelog

0.1.0:
- Initial release
- Logitech Media Server version installed: 8.2.1


## License

MIT