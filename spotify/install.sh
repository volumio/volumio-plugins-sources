#!/bin/bash

echo "Installing Go-librespot"

ARCH=$(grep ^VOLUMIO_ARCH /etc/os-release | tr -d 'VOLUMIO_ARCH="')

if [ "$ARCH" = "arm" ]; then
	ARCH="armv6_rpi"
elif [ "$ARCH" = "armv7" ]; then
  ARCH="armv6"
elif  [ "$ARCH" = "amd64" ] || [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "x64" ]; then
	ARCH="x86_64"
elif  [ "$ARCH" = "i386" ] || [ "$ARCH" = "i686" ] || [ "$ARCH" = "x86" ]; then
	echo "Platform not supported" 
  exit 1
fi


echo "Checking old vollibrespot installs"

killall vollibrespot
systemctl stop volspotconnect.service
systemctl disable volspotconnect.service
systemctl daemon-reload

## Spotify legacy
VOLLIB_PATH=/usr/bin/vollibrespot
VOLLIB_SYSTEMD=/lib/systemd/system/volspotconnect.service
if [ -f $VOLLIB_PATH ]; then
  echo "Clearing old vollibrespot"
  rm $VOLLIB_PATH
  [ -f $VOLLIB_SYSTEMD ] || rm $VOLLIB_SYSTEMD
  echo "vollibrespot cleared"
fi

## volspotconnect2
VOLSPOTCONNECT2_PATH=/data/plugins/music_service/volspotconnect2/
if [ -d $VOLSPOTCONNECT2_PATH ]; then
  echo "Clearing old volspotconnect2 plugin"
  systemctl stop volspotconnect2.service
  systemctl disable volspotconnect2.service
  rm -rf $VOLSPOTCONNECT2_PATH
  echo "volspotconnect2 plugin cleared"
fi

## go-librespot
DAEMON_BASE_URL=https://github.com/devgianlu/go-librespot/releases/download/v
VERSION=0.5.2
DAEMON_ARCHIVE=go-librespot_linux_$ARCH.tar.gz
DAEMON_DOWNLOAD_URL=$DAEMON_BASE_URL$VERSION/$DAEMON_ARCHIVE
DAEMON_DOWNLOAD_PATH=/home/volumio/$DAEMON_ARCHIVE

echo "Downloading daemon"
systemctl stop go-librespot-daemon.service
wget "$DAEMON_DOWNLOAD_URL" -O "$DAEMON_DOWNLOAD_PATH"
tar xf "$DAEMON_DOWNLOAD_PATH" -C /usr/bin/ go-librespot
rm "$DAEMON_DOWNLOAD_PATH"
chmod a+x /usr/bin/go-librespot

echo "Creating directories"

DAEMON_DATA_PATH=/data/go-librespot/

if [ ! -d $DAEMON_DATA_PATH ]; then
  echo "Creating data directory"
  mkdir -p $DAEMON_DATA_PATH
  chown -R volumio:volumio $DAEMON_DATA_PATH
fi

if [ -f /tmp/go-librespot-config.yml ] ; then
  cp /tmp/go-librespot-config.yml \$DAEMON_DATA_PATH/config.yml
  chown volumio:volumio \$DAEMON_DATA_PATH/config.yml
  rm /tmp/go-librespot-config.yml
fi

if [ -f /data/configuration/music_service/spop/spotifycredentials.json ] ; then
  cp /data/configuration/music_service/spop/spotifycredentials.json \$DAEMON_DATA_PATH/credentials.json
  chown volumio:volumio \$DAEMON_DATA_PATH/credentials.json
  rm /data/configuration/music_service/spop/spotifycredentials.json
fi


echo "Creating Start Script"
cat > /bin/start-go-librespot.sh << EOF
#!/bin/sh

# Traceback Setting
export GOTRACEBACK=crash

echo 'go-librespot daemon starting...'
/usr/bin/go-librespot --config_dir ${DAEMON_DATA_PATH}
EOF

chmod a+x /bin/start-go-librespot.sh

# Delete old misspelled script
rm -f /bin/start-go-liberspot.sh


echo "[Unit]
Description = go-librespot Daemon
After = volumio.service

[Service]
ExecStart=/bin/start-go-librespot.sh
Restart=always
RestartSec=3
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=go-librespot
User=volumio
Group=volumio
[Install]
WantedBy=multi-user.target" > /lib/systemd/system/go-librespot-daemon.service

systemctl daemon-reload

#required to end the plugin install
echo "plugininstallend"
