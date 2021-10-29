#!/bin/bash
cp /data/plugins/music_service/music_services_shield/musicservicesshield.service /etc/systemd/system/
systemctl start musicservicesshield
systemctl enable musicservicesshield
