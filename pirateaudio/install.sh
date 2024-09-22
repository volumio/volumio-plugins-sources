#!/bin/bash
echo "Installing pirateaudio dependencies"
# set path
papath=/data/plugins/system_hardware/pirateaudio

echo "Installing pirateaudio service"
# Copy service to the right place
cp $papath/pirateaudio.service /etc/systemd/system/
# change file permission
sudo chmod 644 /etc/systemd/system/pirateaudio.service
# inform system about new service
sudo systemctl daemon-reload
# enable service
systemctl enable pirateaudio.service

# Install the required packages via apt-get, install new python 3.x depencies
echo "Installing new python 3.x and pip3 dependencies for pirateaudio plugin"
sudo apt-get update
sudo apt-get install -y python3-rpi.gpio python3-spidev python3-pip python3-pil python3-numpy
sudo pip3 install st7789 "python-socketio>=4,<5"

# undo changes to userconfig for pirate audio hat in case of updating plugin
sudo sed -i '/### End of parameters for pirateaudio plugin ###/d' /boot/userconfig.txt
sudo sed -i '/gpio=13=op,dl/d' /boot/userconfig.txt
sudo sed -i '/gpio=25=op,dh/d' /boot/userconfig.txt
sudo sed -i '/dtparam=spi=on/d' /boot/userconfig.txt
sudo sed -i '/### Start of parameters for pirateaudio plugin ###/d' /boot/userconfig.txt

echo "userconfig.txt: adding parameters"
sudo sed -i.bak '1 i\### End of parameters for pirateaudio plugin ###' /boot/userconfig.txt
sudo sed -i '1 i\gpio=13=op,dl' /boot/userconfig.txt
sudo sed -i '1 i\gpio=25=op,dh' /boot/userconfig.txt
sudo sed -i '1 i\dtparam=spi=on' /boot/userconfig.txt
sudo sed -i '1 i\### Start of parameters for pirateaudio plugin ###' /boot/userconfig.txt

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

#requred to end the plugin install
echo "plugininstallend"
