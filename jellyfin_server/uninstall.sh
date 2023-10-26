#!/bin/bash

if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -e
pushd "$(dirname "$0")"/dist/scripts > /dev/null
./uninstall_jellyfin.sh
popd > /dev/null
echo "Jellyfin Server plugin uninstalled"
