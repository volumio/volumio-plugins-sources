#! /bin/bash

[ -z "$JELLYFIN_DIR" ] && . common.sh
check_root
echo "Uninstalling Jellyfin server..."

if [ ! -d "$JELLYFIN_DIR" ]; then
    echo "Warning: $JELLYFIN_DIR does not exist."
    exit
fi

cd "$JELLYFIN_DIR"
docker-compose down --rmi 'all'
docker volume rm jellyfin-config jellyfin-cache

rm -rf "$JELLYFIN_DIR"
