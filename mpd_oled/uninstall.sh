#!/bin/bash

# Remove plugin service
service="mpd_oled_plugin"

systemctl is-active --quiet $service && systemctl stop $service
systemctl disable $service
rm /etc/systemd/system/$service.service
systemctl daemon-reload
systemctl reset-failed

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
sudo apt remove -y mpd-oled

echo "Done!"

# required to end uninstallation
echo "pluginuninstallend"
