#!/bin/bash

echo "Initializing config"

# compatibilty with Volumio2 config files due to directory rename
if [ -f /data/configuration/system_controller/gpio-buttons/config.json ];then
	mv /data/configuration/system_controller/gpio-buttons /data/configuration/system_hardware/gpio-buttons
fi

echo "plugininstallend"
