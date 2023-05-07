#!/bin/bash

echo "Removing dependencies"
apt-get -y purge --auto-remove fonts-arphic-ukai
apt-get -y purge --auto-remove fonts-arphic-gbsn00lp
apt-get -y purge --auto-remove fonts-unfonts-core
if grep -q Raspberry /proc/cpuinfo; then # on Raspberry Pi hardware
  apt-mark unhold libraspberrypi0 raspberrypi-bootloader raspberrypi-kernel
  apt-get -y purge --auto-remove chromium-browser
  apt-get -y purge --auto-remove openbox
  apt-get -y purge --auto-remove xinit
  apt-get -y purge --auto-remove libraspberrypi0
  apt-get -y purge --auto-remove raspberrypi-bootloader
  apt-get -y purge --auto-remove raspberrypi-kernel
else # on other hardware
  apt-get -y purge --auto-remove chromium
  apt-get -y purge --auto-remove openbox
  apt-get -y purge --auto-remove xinit
  rm /usr/bin/chromium-browser
fi

echo "Deleting /opt/volumiokiosk.sh"
rm /opt/volumiokiosk.sh

echo "Deleting /data/volumiokiosk"
rm -rf /data/volumiokiosk

echo "Deleting /lib/systemd/system/volumio-kiosk.service"
rm /lib/systemd/system/volumio-kiosk.service

if [ -f /etc/X11/xorg.conf.d/95-touch_display-plugin.conf ]; then
  echo "Deleting /etc/X11/xorg.conf.d/95-touch_display-plugin.conf"
  rm /etc/X11/xorg.conf.d/95-touch_display-plugin.conf
fi

echo "Done"
echo "pluginuninstallend"
