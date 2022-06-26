#! /bin/bash

UNINSTALLING=1

[ -z "${OPT_DIR}" ] && . common.sh
check_root
echo "Uninstalling ${APP_NAME}..."

if [ ! -d "${OPT_DIR}" ]; then
    echo "Error: ${OPT_DIR} does not exist. Skipping ${APP_NAME} uninstallation..."
    exit 0 # exit with code 0 so plugin files / config will still get removed
fi

cd "${OPT_DIR}"
docker-compose down --rmi 'all'
if [ ! -z "${DOCKER_VOLUME_NAMES}" ]; then
    echo "Removing volumes..."
    for VOLUME_NAME in ${DOCKER_VOLUME_NAMES[@]}; do
        docker volume rm "${VOLUME_NAME}"
    done
fi

rm -rf "${OPT_DIR}"
