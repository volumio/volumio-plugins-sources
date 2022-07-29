#!/bin/bash

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

# set current directory
cd /home/volumio/

# refresh packages
echo "Updating packages"
sudo apt-get update
wget -N http://pitastic.com/mpd_oled/packages/mpd_oled_volumio_install_latest.sh
sudo bash mpd_oled_volumio_install_latest.sh


##############################
# install CAVA if not present
if [ ! -d "/home/volumio/cava" ]
then
  echo "Installing CAVA"
  sudo apt-get -y install git-core autoconf make libtool libfftw3-dev libasound2-dev
  git clone https://github.com/karlstav/cava
  cd cava
  ./autogen.sh
  ./configure
  make
  sudo make install
  cd ..
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

#required to end the plugin install
echo "plugininstallend"
