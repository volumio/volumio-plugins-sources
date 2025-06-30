#!/bin/bash

# Uninstall dependendencies

systemctl stop evo_oled2	
systemctl stop evo_remote
systemctl stop evo_irexec

rm /etc/systemd/system/evo_oled2.service
rm /etc/systemd/system/evo_remote.service
rm /etc/systemd/system/evo_irexec.service


echo "Done"
echo "pluginuninstallend"