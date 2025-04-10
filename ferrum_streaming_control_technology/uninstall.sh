#!/bin/bash

# Uninstall dependendencies
# apt-get remove -y

sudo rm -rf /etc/udev/rules.d/9-fsct-usb-devices.rules
sudo udevadm control -R
sudo udevadm trigger

echo "Done"
echo "pluginuninstallend"
