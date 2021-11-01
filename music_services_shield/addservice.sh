#!/bin/bash
cp /data/plugins/system_hardware/music_services_shield/musicservicesshield.service /etc/systemd/system/
systemctl start musicservicesshield
systemctl enable musicservicesshield
