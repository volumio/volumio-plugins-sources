#!/bin/bash
echo "Installing systeminfo"

configpath=/data/configuration/user_interface/Systeminfo

## Removing previous config
if [ ! -f "${configpath}/config.json" ];
then
  echo "Configuration file doesn't exist, nothing to do"
else
  echo "Configuration File exists removing it"
  sudo rm ${configpath}/config.json
fi



# Find arch
cpu=$(lscpu | awk 'FNR == 1 {print $2}')
echo "Detected cpu architecture as $cpu"
if [ $cpu = "armv7l" ] || [ $cpu = "aarch64" ] || [ $cpu = "armv6l" ]
then
sudo cp /data/plugins/user_interface/Systeminfo/c/hw_params_arm /data/plugins/user_interface/Systeminfo/hw_params
sudo chmod +x /data/plugins/user_interface/Systeminfo/hw_params
sudo chmod +x /data/plugins/user_interface/Systeminfo/firmware.sh
elif [ $cpu = "x86_64" ]
then
sudo cp /data/plugins/user_interface/Systeminfo/c/hw_params_amd64 /data/plugins/user_interface/Systeminfo/hw_params
sudo chmod +x /data/plugins/user_interface/Systeminfo/hw_params
sudo chmod +x /data/plugins/user_interface/Systeminfo/firmware.sh
else
        echo "Sorry, cpu is $cpu and your device is not yet supported !"
	echo "exit now..."
	exit -1
fi


#required to end the plugin install
echo "plugininstallend"
