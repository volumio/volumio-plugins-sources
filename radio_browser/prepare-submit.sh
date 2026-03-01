#!/bin/bash
# Prepares the plugin on the Volumio device for "volumio plugin submit".
# See: https://developers.volumio.com/plugins/plugin-publishing
#
# Usage:
#   ./prepare-submit.sh
#   VOLUMIO_IP=192.168.177.79 ./prepare-submit.sh
#
# Target on device: volumio-plugins-sources/radio_browser (official structure)

set -e

IP="${VOLUMIO_IP:-192.168.177.79}"
USER="volumio"
TARGET="$USER@$IP"
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📤 Preparing plugin submission on Volumio ($TARGET)..."
echo "   Source: $PLUGIN_DIR"
echo ""

# 1. Create tar (without node_modules – installed on device)
echo "-> Creating plugin archive..."
tar --exclude='node_modules' --exclude='.git' --exclude='radio_browser.zip' \
    --exclude='radio_browser.tar.gz' --exclude='deploy.sh' --exclude='prepare-submit.sh' \
    --exclude='SUBMIT-ANLEITUNG.md' \
    -czf /tmp/radio_browser_submit.tar.gz -C "$PLUGIN_DIR" .

# 2. Copy to device
echo "-> Copying to Volumio..."
scp -o StrictHostKeyChecking=no /tmp/radio_browser_submit.tar.gz $TARGET:/tmp/

# 3. On device: create directory, extract, npm install
# volumio-plugins-sources has plugins at root level: radio_browser, spotify, etc.
echo "-> Installing on Volumio..."
ssh -o StrictHostKeyChecking=no $TARGET << 'REMOTE'
  mkdir -p /home/volumio/volumio-plugins-sources
  rm -rf /home/volumio/volumio-plugins-sources/radio_browser
  mkdir -p /home/volumio/volumio-plugins-sources/radio_browser
  tar -xzf /tmp/radio_browser_submit.tar.gz -C /home/volumio/volumio-plugins-sources/radio_browser
  rm /tmp/radio_browser_submit.tar.gz
  
  cd /home/volumio/volumio-plugins-sources/radio_browser
  npm install --production
REMOTE

rm -f /tmp/radio_browser_submit.tar.gz

echo ""
echo "✅ Preparation complete!"
echo ""
echo "For plugin store submission:"
echo "  1. Code must be committed & pushed to https://github.com/elpatron68/volumio-plugins-sources"
echo "  2. If needed: clone volumio-plugins-sources on the device (elpatron68/volumio-plugins-sources)"
echo "  3. Then:"
echo ""
echo "     ssh $TARGET"
echo "     cd /home/volumio/volumio-plugins-sources/radio_browser"
echo "     volumio plugin submit"
echo ""
echo "Note: volumio plugin submit checks if code is pushed."
echo "      Without a Git fork on the device, the check will fail."
echo "      Alternative: clone fork, overwrite plugin files, commit & push."
echo ""
