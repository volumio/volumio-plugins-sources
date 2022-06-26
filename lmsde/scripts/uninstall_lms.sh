#! /bin/bash

UNINSTALLING=1

[ -z "${LMS_DIR}" ] && . common.sh
check_root
echo "Uninstalling Logitech Media Server..."

if [ ! -d "${LMS_DIR}" ]; then
    echo "Error: ${LMS_DIR} does not exist. Skipping LMS uninstallation..."
    exit 0 # exit with code 0 so plugin files / config will still get removed
fi

cd "${LMS_DIR}"
docker-compose down --rmi 'all'
docker volume rm logitechmediaserver-config logitechmediaserver-music logitechmediaserver-playlist

rm -rf "${LMS_DIR}"
