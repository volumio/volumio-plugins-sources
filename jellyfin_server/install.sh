#!/bin/bash

if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -e
pushd "$(dirname "$0")"/dist/scripts > /dev/null
# Volumio resets x mode when unpacking, need to add them back
chmod +x *.sh
./install_jellyfin.sh
popd > /dev/null
echo "Jellyfin Server plugin installed"
echo "plugininstallend"
