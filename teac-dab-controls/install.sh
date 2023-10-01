#!/bin/bash

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install
echo "Installing teac-dab-controls Dependencies"
apt-get update
# Install the required packages via apt-get
apt-get -y install pigpio python3-dev

pip3 install python-engineio==3.14.2 python-socketio[client]==4.6.0 adafruit-blinka Adafruit-PlatformDetect adafruit-python-shell adafruit_circuitpython_mcp3xxx adafruit_circuitpython_bitbangio RPi.GPIO pigpio retrying
pip3 install git+https://github.com/domb84/rpi-lcd-menu.git

sed -i "/ExecStart=/c\ExecStart=/usr/bin/pigpiod -t 0" /lib/systemd/system/pigpiod.service

cp teac-dab-controls.service /lib/systemd/system/

systemctl daemon-reload -q

#requred to end the plugin install
echo "plugininstallend"