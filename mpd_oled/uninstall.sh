#!/bin/bash

# record if mpd_oled is initially running as service, and stop if running
if systemctl is-active --quiet mpd_oled; then
  systemctl stop mpd_oled
fi

# Kill mpd_oled, mpd_oled_cava and cava
killall --quiet cava
killall --quiet mpd_oled_cava
killall --quiet mpd_oled

# Remove CAVA binary
if [ -f "/usr/local/bin/mpd_oled_cava" ]
then
  echo "Removing CAVA"
  rm -f /usr/local/bin/mpd_oled_cava
fi
if [ -d "/usr/local/share/consolefonts" ]
then
  echo "Removing console fonts directory"
  rm -r /usr/local/share/consolefonts
fi

# Remove mpd_oled
if [ -d "/home/volumio/mpd_oled" ]
then
	echo "Removing mpd_oled"
	rm -r /home/volumio/mpd_oled
fi

sudo apt remove -y mpd-oled

echo "Done!"

# required to end uninstallation
echo "pluginuninstallend"
