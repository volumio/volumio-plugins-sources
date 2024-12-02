#!/bin/bash

echo "Removing dependencies"
apt-get -y purge --auto-remove fonts-arphic-ukai
apt-get -y purge --auto-remove fonts-arphic-gbsn00lp
apt-get -y purge --auto-remove fonts-unfonts-core
apt-get -y purge --auto-remove fonts-ipafont
apt-get -y purge --auto-remove fonts-vlgothic
apt-get -y purge --auto-remove fonts-thai-tlwg-ttf

if grep -q Raspberry /proc/cpuinfo; then # on Raspberry Pi hardware
  apt-get -y purge --auto-remove chromium-browser
else # on other hardware
  apt-get -y purge --auto-remove chromium
  rm /usr/bin/chromium-browser
fi
apt-get -y purge --auto-remove openbox
apt-get -y purge --auto-remove xinit

echo "Deleting /opt/volumiokiosk.sh"
rm /opt/volumiokiosk.sh

echo "Deleting /data/volumiokiosk"
rm -rf /data/volumiokiosk

echo "Deleting /data/volumiokioskextensions"
rm -rf /data/volumiokioskextensions

echo "Deleting /lib/systemd/system/volumio-kiosk.service"
rm /lib/systemd/system/volumio-kiosk.service

if [ -f /etc/X11/xorg.conf.d/95-touch_display-plugin.conf ]; then
  echo "Deleting /etc/X11/xorg.conf.d/95-touch_display-plugin.conf"
  rm /etc/X11/xorg.conf.d/95-touch_display-plugin.conf
fi

if [ -f /etc/X11/xorg.conf.d/99-vc4.conf ]; then
  echo "Deleting /etc/X11/xorg.conf.d/99-vc4.conf"
  rm /etc/X11/xorg.conf.d/99-vc4.conf
fi

echo "Enabling login prompt"
systemctl enable getty@tty1.service

echo "Done"
echo "pluginuninstallend"
