#!/bin/bash

echo "volumio" | sudo -S --prompt="" sed -i 's/option/#option/g' /etc/modprobe.d/alsa-base.conf
echo "volumio" | sudo -S --prompt=""  sed -i 's/##option/#option/g' /etc/modprobe.d/alsa-base.conf
echo "volumio" | sudo -S --prompt=""  systemctl restart alsa-state.service
echo "volumio" | sudo -S --prompt=""  systemctl restart sound.target
echo "volumio" | sudo -S --prompt=""  docker restart $(docker ps -a -q)