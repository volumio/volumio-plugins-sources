#!/bin/bash

echo "Installing build-essential"
apt-get update
apt-get -y install build-essential
cd $(dirname $0)

echo "Installing module \"onoff\""
npm install onoff@^6.0.0

#required to end the plugin install
echo "plugininstallend"
