#!/bin/bash
papath=/data/plugins/system_hardware/pirateaudio
echo "Uninstall pirate audio dependencies"
# Delete service 
sudo rm -rf /etc/systemd/system/pirateaudio.service
# inform system about deleted service
sudo systemctl daemon-reload

# put backup of userconfig.txt back in place
# cp /boot/userconfig.txt.bak /boot/userconfig.txt
# undo changes to userconfig for pirate audio hat in case of updating plugin
sudo sed -i '/### End of parameters for pirateaudio plugin ###/d' /boot/userconfig.txt
sudo sed -i '/gpio=13=op,dl/d' /boot/userconfig.txt
sudo sed -i '/gpio=25=op,dh/d' /boot/userconfig.txt
sudo sed -i '/dtparam=spi=on/d' /boot/userconfig.txt
sudo sed -i '/### Start of parameters for pirateaudio plugin ###/d' /boot/userconfig.txt

# Uninstall dependendencies
# apt-get remove -y

echo "Done"
echo "plugin uninstallend"