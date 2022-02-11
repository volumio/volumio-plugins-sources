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

  echo "Removing build-essential"
  apt-get -y purge --auto-remove build-essential

  #required to end the plugin install
  echo "plugininstallend"
}
trap "exit_cleanup" EXIT

echo "Completing \"UIConfig.json\""
sed -i "s/\${plugin_type}/$(grep "\"plugin_type\":" "$PLUGIN_DIR"/package.json | cut -d"\"" -f4)/" "$PLUGIN_DIR"/UIConfig.json || { echo "Completing \"UIConfig.json\" failed"; exit 1; }

echo "Installing build-essential"
apt-get update
apt-get -y install build-essential || { echo "Installing build-essential failed"; exit 1; }

echo "Installing module \"onoff\""
npm install --prefix "$PLUGIN_DIR" onoff@^6.0.0 || { echo "Installing module \"onoff\" failed"; exit 1; }

