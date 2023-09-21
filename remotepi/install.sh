#!/bin/bash

exit_cleanup() {
  ERR="$?"
  if [ "$ERR" -ne 0 ]; then
    echo "Plugin failed to install!"
    echo "Cleaning up..."
    if [ -d "$PLUGIN_DIR" ]; then
      [ "$ERR" -eq 1 ] && . ."$PLUGIN_DIR"/uninstall.sh | grep -v "pluginuninstallend"
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

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd -P)" || { echo "Determination of plugin folder's name failed"; exit 3; }
PLUGIN_TYPE=$(grep "\"plugin_type\":" "$PLUGIN_DIR"/package.json | cut -d "\"" -f 4) || { echo "Determination of plugin type failed"; exit 3; }
PLUGIN_NAME=$(grep "\"name\":" "$PLUGIN_DIR"/package.json | cut -d "\"" -f 4) || { echo "Determination of plugin name failed"; exit 3; }

sed -i "s/\${plugin_type\/plugin_name}/$PLUGIN_TYPE\/$PLUGIN_NAME/" "$PLUGIN_DIR"/UIConfig.json || { echo "Completing \"UIConfig.json\" failed"; exit 3; }

echo "Installing build-essential"
apt-get update || { echo "Running apt-get update failed"; exit 3; }
apt-get -y install build-essential || { echo "Installing build-essential failed"; exit 3; }

echo "Installing module \"onoff\""
npm install --prefix "$PLUGIN_DIR" onoff@^6.0.0 || { echo "Installing module \"onoff\" failed"; exit 3; }
