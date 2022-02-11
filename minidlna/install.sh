#!/bin/bash

PLUGIN_DIR="$(cd "$(dirname "$0")"; pwd -P)"

exit_cleanup() {
  if [ "$?" -ne 0 ]; then
    echo "Plugin failed to install!"
    echo "Cleaning up..."
    if [ -d "$PLUGIN_DIR" ]; then
      . ."$PLUGIN_DIR"/uninstall.sh | grep -v "pluginuninstallend"
      echo "Removing plugin directory $PLUGIN_DIR"
      rm -rf "$PLUGIN_DIR"
    else
      echo "Plugin directory could not be found: Cleaning up failed."
    fi
  fi

  #required to end the plugin install
  echo "plugininstallend"
}
trap "exit_cleanup" EXIT

echo "Completing \"UIConfig.json\""
sed -i "s/\${plugin_type}/$(grep "\"plugin_type\":" "$PLUGIN_DIR"/package.json | cut -d "\"" -f 4)/" "$PLUGIN_DIR"/UIConfig.json || { echo "Completing \"UIConfig.json\" failed"; exit 1; }

echo "Installing MiniDLNA"
apt-get update
apt-get -y install minidlna || { echo "Installation of minidlna failed"; exit 1; }
systemctl disable minidlna.service
systemctl stop minidlna.service
rm /etc/minidlna.conf
rm /data/minidlna.conf

MINIDLNAD=$(whereis -b minidlnad | cut -d ' ' -f 2)
echo "Creating systemd unit /etc/systemd/system/minidlna.service"
echo "[Unit]
Description=MiniDLNA lightweight DLNA/UPnP-AV server
Documentation=man:minidlnad(1) man:minidlna.conf(5)
After=local-fs.target remote-fs.target nss-lookup.target network.target

[Service]
User=volumio
Group=volumio

Environment=CONFIGFILE=/data/minidlna.conf
Environment=DAEMON_OPTS=
EnvironmentFile=-/etc/default/minidlna

RuntimeDirectory=minidlna
PIDFile=/run/minidlna/minidlna.pid
ExecStart=$MINIDLNAD -f \$CONFIGFILE -P /run/minidlna/minidlna.pid \$DAEMON_OPTS

[Install]
WantedBy=multi-user.target" > /etc/systemd/system/minidlna.service || { echo "Creating systemd unit /etc/systemd/system/minidlna.service failed"; exit 1; }
systemctl daemon-reload

echo "Setting values for \"network_interface\" and \"model_number\" in ""$PLUGIN_DIR""/config.json"
sed -i "/\"value\": \"eth0,wlan0\"/s/\"eth0,wlan0\"/\"$(ip -o link show | grep -v ": lo:" | cut -s -d ":" -f 2 | cut -s -d " " -f 2 | tr "[:cntrl:]" "," | head --bytes -1)\"/1" "$PLUGIN_DIR"/config.json
sed -i "/\"value\": \"Volumio Edition\"/s/\"Volumio Edition\"/\"$("$MINIDLNAD" -V | tr -d "[:cntrl:]")\"/1" "$PLUGIN_DIR"/config.json

echo "Setting permissions to MiniDLNA folders"
chown -R volumio:volumio /var/cache/minidlna/ || { echo "Setting permissions to MiniDLNA folders failed"; exit 1; }
