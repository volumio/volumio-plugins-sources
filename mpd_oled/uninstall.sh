#!/bin/bash

# record if mpd_oled is initially running as service, and stop if running
if systemctl is-active --quiet mpd_oled; then
  systemctl stop mpd_oled
fi

# Kill mpd_oled, mpd_oled_cava and cava, just to be sure, don't restart later
killall --quiet cava
killall --quiet mpd_oled_cava
killall --quiet mpd_oled

# remove cava if present
if [ -d "/home/volumio/cava" ]
then
	echo "Removing cava"
	rm -r /home/volumio/cava
fi

# remove mpd_oled if present
if [ -d "/home/volumio/mpd_oled" ]
then
	echo "Removing mpd_oled"
	rm -r /home/volumio/mpd_oled
fi

echo "Done!"

# required to end uninstallation
echo "pluginuninstallend"
