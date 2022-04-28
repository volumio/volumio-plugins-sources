#!/bin/bash

PLUGIN_DIR="$(cd "$(dirname "$0")"; pwd -P)"

exit_cleanup() {
  if [ "$?" -ne 0 ]; then
    echo "Plugin failed to install!"
    echo "Cleaning up..."
    if [ -d "$PLUGIN_DIR" ]; then
      . ."$PLUGIN_DIR"/uninstall.sh | grep -v "pluginuninstallend"
      echo "Removing plugin directory $PLUGIN_DIR"
      rm -rf "$PLUGIN_DIR"
    else
      echo "Plugin directory could not be found: Cleaning up failed."
    fi
  fi

  #required to end the plugin install
  echo "plugininstallend"
}
trap "exit_cleanup" EXIT

echo "Installing LIRC"
apt-get update
apt-get -y install lirc || { echo "Installation of lirc failed"; exit 1; }

echo "Creating lircrc file"
touch /etc/lirc/lircrc || { echo "Creating /etc/lirc/lircrc failed"; exit 1; }
if [ "$(dpkg -s lirc | awk -F'[^0-9]*' '/Version: [0-9]+/{if ($2 == 0 && ($3 < 9 || ($3 == 9 && $4 < 4))) $0="legacy"; else $0=""; print $0}')" = "legacy" ]; then
  # for lirc version < 0.9.4
  echo "Applying LIRC starting policy"
  systemctl disable lirc.service
  systemctl stop lirc.service
else
  ln -sf /etc/lirc/lircrc /etc/lirc/irexec.lircrc || { echo "Linking /etc/lirc/lircrc to /etc/lirc/irexec.lircrc failed"; exit 1; }
  echo "Applying LIRC starting policy"
  systemctl disable lircd.service
  systemctl stop lircd.service
fi

echo "Creating folder for custom LIRC configurations"
mkdir -p -m 777 /data/INTERNAL/ir_controller/configurations || { echo "Creating /data/INTERNAL/ir_controller/configurations failed"; exit 1; }
chown volumio:volumio /data/INTERNAL/ir_controller/configurations || { echo "Setting permissions to custom configurations folder failed"; exit 1; }
