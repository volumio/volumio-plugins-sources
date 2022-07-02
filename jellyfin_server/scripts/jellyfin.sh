#! /bin/bash

pushd "$(dirname "$0")" > /dev/null

[ -z "${OPT_DIR}" ] && . common.sh
check_root

start_service() {
  pushd "${OPT_DIR}" > /dev/null
  # Compatibility with Music Services Shield plugin:
  # Check if 'user' cpuset (created by MSS) exists. If so, set cgroup parent of Docker container to 'system' (also created by MSS).
  if [ -d "/sys/fs/cgroup/cpuset/user" ]; then
    CGROUP_PARENT="/system"
  else
    CGROUP_PARENT="/"
  fi
  cp "${OPT_DIR}/docker-compose.yml.template" "${OPT_DIR}/docker-compose.yml"
  sed -i 's|${DOCKER_CGROUP_PARENT}|'"${CGROUP_PARENT}"'|' "${OPT_DIR}/docker-compose.yml"
  COMPOSE_HTTP_TIMEOUT=600 docker-compose up -d
  popd > /dev/null
}

stop_service() {
  pushd "${OPT_DIR}" > /dev/null
  docker-compose stop
  popd > /dev/null
}

get_status() {
  if [ "$(is_running)" == '1' ]; then
    echo "${APP_NAME} is running"
  else
    echo "${APP_NAME} is not running"
  fi
}

# parse arguments
EXIT_CODE=0
for i in "$@"
do
case $i in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    status)
        get_status
        ;;
    *)
        echo "Unknown option ${i}. Valid: start | stop | status"
        EXIT_CODE=1
        ;;
esac
done

popd > /dev/null
exit $EXIT_CODE
