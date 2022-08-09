#!/bin/bash

# set current directory
cd /home/volumio/

# Install binary of mpd_oled
wget -N http://pitastic.com/mpd_oled/packages/mpd_oled_volumio_install_latest.sh
sudo bash mpd_oled_volumio_install_latest.sh

# Installing i2c-tools
echo "Installing i2c-tools for screen detection"
sudo apt-get --assume-yes install i2c-tools

##############################
# install CAVA if not present
if [ ! -f "/usr/local/bin/mpd_oled_cava" ]
then
  echo "Installing CAVA"
  sudo cp ./cava /usr/local/bin/mpd_oled_cava
  sudo mkdir /usr/local/share/consolefonts
  sudo cp ./cava.psf /usr/local/share/consolefonts
else
  echo "CAVA already installed"
fi

########################
# check i2c system buses 
echo "Checking I2C busses"
if ! grep -q "dtparam=i2c_arm=on" "/boot/config.txt"; then
  echo "* I2C-1 bus enabled"
else
  echo "* 12C-1 bus disabled"
fi
if ! grep -q "dtparam=i2c_vc=on" "/boot/config.txt"; then
  echo "* I2C-0 bus enabled"
else
  echo "* I2C-0 bus disabled"
fi

###############################################
# append I2C baudrate if it is not already set
if ! grep -q "i2c_arm_baudrate" "/boot/config.txt"; then
  if ! grep -q "i2c_arm_baudrate" "/boot/userconfig.txt"; then
    echo "Setting I2C baudrate"
    echo "dtparam=i2c_arm_baudrate=800000" >> /boot/userconfig.txt
  fi
fi

#############################################
# enable SPI if not enabled
if ! grep -q "spi=on" "/boot/config.txt"; then
  if ! grep -q "spi=on" "/boot/userconfig.txt"; then
    echo "Enabling SPI"
    echo "dtparam=spi=on" >> /boot/userconfig.txt
  fi
fi

# remove temporary install scrip
rm -f mpd_oled_volumio_install_latest.sh

# required to end the plugin install
echo "plugininstallend"
