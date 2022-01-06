#!/bin/bash

echo "Removing dependencies"
rm /etc/lirc/lircrc
apt-get -y purge --auto-remove lirc

echo "Removing folder for custom LIRC configurations"
rm -r /data/INTERNAL/ir_controller

echo "Done"
echo "pluginuninstallend"
