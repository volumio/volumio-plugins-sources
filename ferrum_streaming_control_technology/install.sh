#!/bin/bash

echo "Installing ferrum streaming control technology Dependencies"
# sudo apt-get update
# Install the required packages via apt-get
# sudo apt-get -y install

sudo cp 09-usb-devices-plugdev.rules /lib/udev/rules.d/
sudo udevadm control -R 
sudo udevadm trigger

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

# here copy different bin file?

#requred to end the plugin install
echo "plugininstallend"
