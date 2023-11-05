#!/bin/bash

#########################################################
#
# Updates Tidal Autoplay plugin to latest version
#
#########################################################

# Download latest release as zip
curl -sL $(curl -s https://api.github.com/repos/fernfrost/volumio-plugin-tidal-autoplay/releases/latest | grep browser_download_url | cut -d\" -f4) -o plugin.zip
unzip -o plugin.zip

# Cleanup before plugin update
rm plugin.zip

# Update plugin
volumio plugin refresh
volumio vrestart