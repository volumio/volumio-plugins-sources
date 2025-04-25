#!/bin/bash

# Uninstall dependendencies
# apt-get remove -y

sudo rm -rf /lib/udev/rules.d/09-usb-devices-plugdev.rules
sudo udevadm control -R
sudo udevadm trigger

echo "Done"
echo "pluginuninstallend"
