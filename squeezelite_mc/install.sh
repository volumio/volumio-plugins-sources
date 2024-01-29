#!/bin/bash

ARCH="$(arch)"
PLUGIN_PATH="/data/plugins/music_service/squeezelite_mc"
SQUEEZELITE_BIN_PATH="/opt/squeezelite"

cleanup_exit_err() {
    rm -rf "${PLUGIN_PATH}"
    exit -1
}

echo "Installing Squeezelite binary..."

if [ -f $SQUEEZELITE_BIN_PATH ]; then
    echo "Installation cannot proceed because ${SQUEEZELITE_BIN_PATH} already exists and points to a file. Do you have other Squeezelite plugin or binary installed? If so, please uninstall it first."
    cleanup_exit_err
elif [ ! -z $(which squeezelite) ]; then
    echo "Installation cannot proceed because conflicting Squeezelite binary $(which squeezelite) found. Please uninstall it first."
    cleanup_exit_err
fi

if [ -d $SQUEEZELITE_BIN_PATH ]; then
    rm -rf $SQUEEZELITE_BIN_PATH
fi

mkdir -p $SQUEEZELITE_BIN_PATH

if [ $ARCH = "armv6l" ] || [ $ARCH = "armv7l" ] || [ $ARCH = "aarch64" ]; then
    ARCHIVE="squeezelite-1.9.9.1403-ffmpeg-armhf.tar.gz"
elif [ $ARCH = "x86_64" ]; then
    ARCHIVE="squeezelite-1.9.9.1392-x86_64.tar.gz"
fi

if [ -z $ARCHIVE ]; then
    echo "Unable to find suitable binary to install (target arch: ${ARCH}). Installation cannot proceed."
    exit -1
fi

echo "Unpacking ${ARCHIVE}"
tar xzf "${PLUGIN_PATH}/bin/${ARCHIVE}" -C $SQUEEZELITE_BIN_PATH
chown volumio:volumio ${SQUEEZELITE_BIN_PATH}/squeezelite
chmod 755 ${SQUEEZELITE_BIN_PATH}/squeezelite

echo "Squeezelite MC installed"
echo "plugininstallend"
