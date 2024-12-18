#!/bin/bash

echo "Installing Squeezelite and its dependencies..."

ARCH=$(arch)
BIN_PATH="/data/plugins/music_service/squeezelite/bin"
SQUEEZELITE_INSTALL_PATH="/opt/squeezelite"
VOLUMIO_OWNER="volumio:volumio"
SYSTEMD_PATH="/etc/systemd/system"
PLUGIN_SYSTEMD_PATH="/data/plugins/music_service/squeezelite/etc/systemd/system"

if [ $ARCH = "armv6l" ] || [ $ARCH = "armv7l" ]; then
	VERSION="squeezelite-1.9.9.1392-armhf"
elif [ $ARCH = "x86_64" ]; then
	VERSION="squeezelite-1.9.9.1392-x86_64"
elif [ $ARCH = "i686" ]; then
	VERSION="squeezelite-1.9.9.1392-i686"
fi

cp "${BIN_PATH}/${VERSION}" $SQUEEZELITE_INSTALL_PATH
	
chown $VOLUMIO_OWNER $SQUEEZELITE_INSTALL_PATH
chmod 755 $SQUEEZELITE_INSTALL_PATH

$SERVICE_FILE="${PLUGIN_SYSTEMD_PATH}/squeezelite.service"
chown $VOLUMIO_OWNER $SERVICE_FILE
		
ln -fs "${PLUGIN_SYSTEMD_PATH}/squeezelite.service" "${SYSTEMD_PATH}/squeezelite.service"
systemctl daemon-reload