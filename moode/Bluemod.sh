#!/bin/bash

echo "volumio" | sudo -S --prompt="" systemctl stop bluetooth.service
echo "volumio" | sudo -S --prompt=""  systemctl disable bluetooth.service
echo "volumio" | sudo -S --prompt=""  systemctl mask bluetooth.service
echo "volumio" | sudo -S --prompt=""  docker restart $(docker ps -a -q)