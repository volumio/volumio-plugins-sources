#!/bin/bash

if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -e
pushd "$(dirname "$0")"/scripts > /dev/null
./uninstall_lms.sh
./uninstall_docker.sh
popd > /dev/null
echo "Logitech Media Server - Docker Edition plugin uninstalled"
