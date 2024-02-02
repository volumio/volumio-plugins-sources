#!/bin/bash
echo "volumio" | sudo -S --prompt=""  systemctl unmask bluetooth.service
echo "volumio" | sudo -S --prompt=""  systemctl enable bluetooth.service
echo "volumio" | sudo -S --prompt="" systemctl start bluetooth.service