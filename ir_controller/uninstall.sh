#!/bin/bash

echo "Removing dependencies"
rm /etc/lirc/lircrc
apt-get -y purge --auto-remove lirc

CUSTOM_DIR="$(grep "\"name\":" "$(cd "$(dirname "$0")" && pwd -P)"/package.json | cut -d "\"" -f 4)"
if [ "$CUSTOM_DIR" ]; then
  echo "Removing folder for custom LIRC configurations"
  rm -rf /data/INTERNAL/"$CUSTOM_DIR"
fi

echo "Done"
echo "pluginuninstallend"
