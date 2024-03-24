#!/bin/bash
echo "volumio" | sudo -S --prompt="" systemctl unmask mpd.service mpd.socket nfs-client.target smbd.service
echo "volumio" | sudo -S --prompt="" systemctl enable mpd.service mpd.socket nfs-client.target smbd.service
echo "volumio" | sudo -S --prompt="" systemctl start mpd.service mpd.socket nfs-client.target smbd.service