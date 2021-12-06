#!/bin/bash

### To be called for plugin deactivation

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
pid_mpdclient=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.pid_mpdclient')
pid_gdbus=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.pid_gdbus')

### Load folder and file locations
. "$MDSP_BF_DIRS"

### Restore MPD service
#/bin/cp -v -f "/lib/systemd/system/mpd.service.bak" "/lib/systemd/system/mpd.service"
/bin/rm -v -r -f "/etc/systemd/system/mpd.service.d/"
/bin/systemctl daemon-reload

### Delete configuration files
/bin/rm -v -f /tmp/mpd.conf.temp
/bin/rm -v -f "$brutefir_in_fifo_folder"mpd.conf
/bin/rm -v -f "$MDSP_BF_CONF"

### Stop all services
/usr/local/bin/volumio stop > /dev/null 2>&1
/usr/bin/sudo /bin/systemctl stop mdsp-bf.service > /dev/null 2>&1
/bin/kill "$pid_mpdclient"
/bin/kill "$pid_gdbus"
#/usr/bin/killall gdbus

/bin/sleep 3
/usr/bin/sudo /bin/systemctl stop mdsp-core.service > /dev/null 2>&1

### Needs reboot!!!
