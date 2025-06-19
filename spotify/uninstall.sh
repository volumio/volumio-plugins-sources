#!/bin/bash

echo "Unistalling go-librespot-daemon"

DAEMON_DATA_PATH=/data/go-librespot/

rm /usr/bin/go-librespot
rm /bin/start-go-librespot.sh
rm /lib/systemd/system/go-librespot-daemon.service
rm -rf $DAEMON_DATA_PATH

echo "Done"
echo "pluginuninstallend"
