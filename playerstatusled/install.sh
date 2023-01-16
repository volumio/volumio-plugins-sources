#!/bin/bash

echo "Installing playerstatusled Dependencies"
sudo apt-get update
# Install the required packages via apt-get. build-essential is required for epoll onoff depends on.
sudo apt-get -y install build-essential --no-install-recommends

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

#requred to end the plugin install
echo "plugininstallend"
