#!/bin/bash


SCRIPT=$(realpath "$0")
current_dir=$(dirname "$SCRIPT")

INSTALLING="/home/volumio/audiophonics_evo_sabre-plugin.installing"

if [ `dpkg --print-architecture` != "armhf" ]; then
	echo "This plugin is made for armhf hardware (Raspberry Pi) and cannot run under a different arch. Nothing will happen."; 
	exit 0;
fi


echo "Installing display OLED#2" 

mkdir "$current_dir"/service

echo "Creating Systemd service for OLED#2 in $current_dir/service/evo_oled2.service"
printf "[Unit]
Description=OLED Display Service for EVO SABRE
After=volumio.service
[Service]
WorkingDirectory=$current_dir/apps/evo_oled
ExecStart=$(which sudo) $(which node) $current_dir/apps/evo_oled/index.js volumio
StandardOutput=null
KillSignal=SIGINT 
Type=simple
User=root
[Install]
WantedBy=multi-user.target"> "$current_dir"/service/evo_oled2.service 
ln -s -f "$current_dir"/service/evo_oled2.service /etc/systemd/system/evo_oled2.service

echo "OLED#2 service created $current_dir/service/evo_oled2.service"
echo "Installing remote control" 

# This package of LIRC comes with about 80mb of GUI deps and we don't want any of that.
apt-get update > /dev/null
apt-get install --no-install-recommends -y lirc > /dev/null

systemctl disable lircd irexec
systemctl stop lircd irexec

# Creating systemd for lirc & irexec driver
printf "[Unit]
Wants=lircd-setup.service
After=network.target lircd-setup.service
[Service]
ExecStart=/usr/sbin/lircd -O "$current_dir"/apps/lirc/lirc_options.conf -o /var/run/lirc/lircd -H default -d /dev/lirc0 -n "$current_dir"/apps/lirc/lircd.conf
Type=simple
User=root
[Install]
WantedBy=multi-user.target
"> "$current_dir"/service/evo_remote.service 
ln -s -f "$current_dir"/service/evo_remote.service  /etc/systemd/system/evo_remote.service


printf "[Unit]
Wants=lircd-setup.service
After=network.target lircd-setup.service
[Service]
ExecStart=/usr/bin/irexec "$current_dir"/apps/lirc/irexec.lircrc
Type=simple
User=root
[Install]
WantedBy=multi-user.target
"> "$current_dir"/service/evo_irexec.service 
ln -s -f "$current_dir"/service/evo_irexec.service  /etc/systemd/system/evo_irexec.service	

chown -R volumio "$current_dir"/service/
systemctl daemon-reload 


# Expose gpio-ir kernel driver
if ! grep -q "dtoverlay=gpio-ir,gpio_pin=4" "/boot/userconfig.txt"; then
	echo "dtoverlay=gpio-ir,gpio_pin=4"  >> /boot/userconfig.txt
fi


#requred to end the plugin install
echo "plugininstallend"


