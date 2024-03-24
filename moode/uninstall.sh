#!/bin/bash

# Uninstall dependendencies
# apt-get remove -y

/bin/sh /data/plugins/music_service/moode/Bluereverse.sh
/bin/sh /data/plugins/music_service/moode/Alsareverse.sh
/bin/sh /data/plugins/music_service/moode/Volumioreverse.sh
docker system prune -a
sudo apt-get purge -y docker*  
sudo apt-get autoremove -y --purge docker*
sudo umount /var/lib/docker/
sudo rm -rf /var/lib/docker /etc/docker
sudo rm /etc/apparmor.d/docker
sudo groupdel docker
sudo rm -rf /var/run/docker.sock
sudo rm -rf /usr/bin/docker-compose

echo "Done"


echo "pluginuninstallend"