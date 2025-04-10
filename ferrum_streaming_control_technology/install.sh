#!/bin/bash

echo "Installing ferrum streaming control technology Dependencies"
sudo apt-get update
# Install the required packages via apt-get
sudo apt-get -y install

# probably needs to install libssl-dev, but I'm not sure
sudo cp 9-fsct-usb-devices.rules /etc/udev/rules.d/
sudo udevadm control -R 
sudo udevadm trigger

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

# here copy different bin file?

#requred to end the plugin install
echo "plugininstallend"
