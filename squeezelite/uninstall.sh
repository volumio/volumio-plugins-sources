## LMS uninstallation script
echo "Uninstalling LMS and its dependencies..."

# Uninstall Squeezelite
unlink /etc/systemd/system/squeezelite.service
unlink /opt/squeezelite
systemctl daemon-reload

#required to end the plugin uninstall
echo "pluginuninstallend"
