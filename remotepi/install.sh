#!/bin/bash

PLUGIN_DIR="$(cd "$(dirname "$0")"; pwd -P)"

exit_cleanup() {
  if [ "$?" -ne 0 ]; then
    echo "Plugin failed to install!"
    echo "Cleaning up..."
    . ."$PLUGIN_DIR"/uninstall.sh | grep -v "pluginuninstallend"
    if [ -d "$PLUGIN_DIR" ]; then
      echo "Removing plugin directory $PLUGIN_DIR"
      rm -rf "$PLUGIN_DIR"
    fi
  fi

  echo "Removing build-essential"
  apt-get -y purge --auto-remove build-essential

  #required to end the plugin install
  echo "plugininstallend"
}
trap "exit_cleanup" EXIT

echo "Installing build-essential"
apt-get update
apt-get -y install build-essential || { echo "Installing build-essential failed"; exit 1; }

echo "Installing module \"onoff\""
cd "$PLUGIN_DIR"
npm install onoff@^6.0.0 || { echo "Installing module \"onoff\" failed"; exit 1; }
