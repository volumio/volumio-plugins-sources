#!/bin/bash

SYSTEMD_SERVICE_FILE="/etc/systemd/system/squeezelite.service"
ALSA_CONF_FILE="/etc/alsa/conf.d/100-squeezelite.conf"
SQUEEZELITE_BIN_PATH="/opt/squeezelite"

if [ -f $SYSTEMD_SERVICE_FILE ]; then
    echo "Removing Squeezelite service..."
    systemctl stop squeezelite
    rm $SYSTEMD_SERVICE_FILE
    systemctl daemon-reload
fi

echo "Cleaning up files..."

if [ -d $SQUEEZELITE_BIN_PATH ]; then
    rm -rf $SQUEEZELITE_BIN_PATH
fi

if [ -f $ALSA_CONF_FILE ]; then
    rm $ALSA_CONF_FILE
fi

echo "Squeezelite MC uninstalled"
