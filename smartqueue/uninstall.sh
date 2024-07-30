#!/bin/bash

## uninstallation script
echo "Uninstalling Smartqueue and its dependencies..."
apt-get -f autoremove shellinabox -y --purge

rm -rf /home/volumio/blissify

# apt-get -f clang libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libsqlite3-dev -y --purge


# 	#required to end the plugin uninstall
echo "pluginuninstallend"
