. install.conf

set -eE

echo_dt() {
  echo "[$(date +"%D %T")] $1"
}

on_error() {
    echo_dt "An error occurred in $(basename "$0"): line ${BASH_LINENO}: ${BASH_COMMAND}"
    if [ ! -z "${INSTALLING}" ]; then
      echo_dt "Installation cannot proceed. Cleaning up plugin directory..."
      [ -d "${PLUGIN_DIR}" ] && rm -rf "${PLUGIN_DIR}"
      echo "plugininstallend"
    elif [ ! -z "${UNINSTALLING}" ]; then
      # Exit with code 0 so plugin files / config will still get removed
      echo_dt "Warning: cannot perform clean uninstallation - there may be leftover files or system settings."
      exit 0
    fi
}

trap 'on_error' ERR
