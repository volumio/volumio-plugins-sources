JELLYFIN_DIR="/opt/jellyfin"

set -eo pipefail

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "Please run as root"
        exit 1
    fi
}

on_error() {
    echo "[jellyfin-server-scripts] An error occurred in $(basename "$0"): line ${BASH_LINENO}: ${BASH_COMMAND}"
    echo "plugininstallend"
}

is_running() {
  if [ "$( docker container inspect -f '{{.State.Status}}' jellyfin )" == "running" ]; then
    echo "1"
  else
    echo "0"
  fi
}

trap 'on_error' ERR
