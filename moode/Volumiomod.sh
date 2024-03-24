#!/bin/bash

echo "volumio" | sudo -S --prompt="" systemctl stop mpd.service mpd.socket nfs-client.target smbd.service
echo "volumio" | sudo -S --prompt="" systemctl disable mpd.service mpd.socket nfs-client.target smbd.service
echo "volumio" | sudo -S --prompt="" systemctl mask mpd.service mpd.socket nfs-client.target smbd.service
echo "volumio" | sudo -S --prompt="" docker exec -ti debian-moode /bin/bash apt reinstall moode-player --fix-missing
echo "volumio" | sudo -S --prompt="" docker restart $(docker ps -a -q)
