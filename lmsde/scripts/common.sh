. install.conf

set -eo pipefail

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "Please run as root"
        exit 1
    fi
}

on_error() {
    echo "An error occurred in $(basename "$0"): line ${BASH_LINENO}: ${BASH_COMMAND}"
    if [ ! -z "${INSTALLING}" ]; then
      echo "Installation cannot proceed."
      echo "plugininstallend"
    elif [ ! -z "${UNINSTALLING}" ]; then
      # Exit with code 0 so plugin files / config will still get removed
      echo "Warning: cannot perform clean uninstallation - there may be leftover files or system settings."
      exit 0
    fi
}

is_running() {
  if [ "$( docker container inspect -f '{{.State.Status}}' "${DOCKER_CONTAINER_NAME}" )" == "running" ]; then
    echo "1"
  else
    echo "0"
  fi
}

trap 'on_error' ERR
