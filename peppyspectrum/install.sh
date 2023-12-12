#!/bin/bash
peppymeterpath=/data/plugins/user_interface/peppyspectrum/PeppySpectrum
spath=/data/plugins/user_interface/peppyspectrum
customfolder=/data/INTERNAL/PeppySpectrum/Templates
mkdir -p $customfolder
chmod 777 -R $customfolder
echo "Installing peppyalsa plugin dependencies"
cp $spath/peppyspectrum.service.tar /
		cd /
		sudo tar -xvf peppyspectrum.service.tar
		rm /peppyspectrum.service.tar
		
sudo apt-get update

echo "cloning peppyspectrum repo"
git clone https://github.com/project-owner/PeppySpectrum.git $peppymeterpath
chmod 777 -R $peppymeterpath
sudo chown -R volumio "$spath" "$customfolder"
sudo chgrp -R volumio "$spath" "$customfolder"

echo "installing apt packages"

sudo apt-get -y install python3-pygame python3
##echo "Installing peppyalsa plugin if needed"

ARCH="$(arch)"
PLUGIN_PATH="/data/plugins/user_interface/peppyspectum"
ALSA_BASE_PATH="${PLUGIN_PATH}/alsa-lib"

cleanup_exit_err() {
    rm -rf "${PLUGIN_PATH}"
    exit -1
}

if [ $ARCH = "armv6l" ] || [ $ARCH = "armv7l" ]; then
    PEPPY_ALSA_PATH="${ALSA_BASE_PATH}/armhf"
elif [ $ARCH = "x86_64" ]; then
    PEPPY_ALSA_PATH="${ALSA_BASE_PATH}/x86_64"
fi

if [ -z $PEPPY_ALSA_PATH ]; then
    echo "Unknown arch: ${ARCH}. Installation cannot proceed."
    cleanup_exit_err
fi

ln -s ${PEPPY_ALSA_PATH}/libpeppyalsa.so.0.0.0 ${PEPPY_ALSA_PATH}/libpeppyalsa.so
ln -s ${PEPPY_ALSA_PATH}/libpeppyalsa.so.0.0.0 ${PEPPY_ALSA_PATH}/libpeppyalsa.so.0
ln -s ${PEPPY_ALSA_PATH}/libpeppyalsa.so ${ALSA_BASE_PATH}/libpeppyalsa.so
#
#echo "Installing peppyalsa plugin if needed"
# if [ ! -f "/usr/local/lib/libpeppyalsa.so" ];
#	then
#		sudo apt-get -y install build-essential autoconf automake libtool libasound2-dev libfftw3-dev
#		mkdir /tmp/peppyalsa
#		git clone https://github.com/project-owner/peppyalsa.git /tmp/peppyalsa
#
#		cd /tmp/peppyalsa
#		aclocal && libtoolize
#		autoconf && automake --add-missing
#		./configure && make
#		sudo make install && exit
#  else
#		echo "peppyalsa already installed, nothing to do"
#fi
pip3 install Pillow
sudo chmod +x /data/plugins/user_interface/peppyspectrum/startpeppyspectrum.sh
#required to end the plugin install
echo "plugininstallend"
