#! /bin/bash

UNINSTALLING=1

[ -z "${LMS_DIR}" ] && . common.sh
check_root

if [ $(docker images -q | wc -l) -gt 0 ]; then
    echo "Found other Docker images. Skipping Docker uninstallation..."
    exit
fi

echo "Uninstalling Docker..."
apt-get remove --purge -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-compose-plugin \
    docker-compose \

# apt-get remove does not stop docker.socket service
# This will cause reinstallation to fail unless device
# is restarted, so we stop it manually here
systemctl stop docker.socket
