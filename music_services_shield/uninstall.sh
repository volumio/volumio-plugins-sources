#!/bin/bash

libpath=/data/plugins/system_hardware/music_services_shield

sudo ${libpath}/removeservice.sh

# Uninstall dependendencies
sudo apt-get remove -y cpuset

echo "Done"
echo "pluginuninstallend"

