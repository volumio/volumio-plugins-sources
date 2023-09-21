#!/bin/bash
echo "Installing geo-tz node dependency"
cd /data/plugins/user_interface/now_playing
npm install --save geo-tz@"^7.0.1"
echo "Now Playing plugin installed"
echo "plugininstallend"
