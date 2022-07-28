#!/bin/bash

if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -e
pushd "$(dirname "$0")"/scripts > /dev/null
# Volumio resets x mode when unpacking, need to add them back
chmod +x *.sh
./install_docker.sh
./install_lms.sh
popd > /dev/null
echo "Logitech Media Server - Docker Edition plugin installed"
echo "plugininstallend"
