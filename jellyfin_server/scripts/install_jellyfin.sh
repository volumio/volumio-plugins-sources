#! /bin/bash

INSTALLING=1

[ -z "${OPT_DIR}" ] && . common.sh
check_root

START_ON_BUILD="0";

echo "Installing ${APP_NAME} ${DOCKER_IMAGE_TAG}..."

# Check if container already exists
# If so, remove it
if [ "$(docker ps -a --format '{{.Names}}' | grep ${DOCKER_CONTAINER_NAME})" ]; then
    # If this is an update, and if the container is running, we 
    # set START_ON_BUILD to "1", so that it gets started
    # when it is rebuilt. This is because Volumio does not
    # restart the plugin when it is updated (but then, it doesn't
    # refresh the updated plugin files, so user should still reboot)
    START_ON_BUILD="$(is_running)"
    echo "Docker container '"${DOCKER_CONTAINER_NAME}"' already exists. Removing it first..."
    docker rm --force "${DOCKER_CONTAINER_NAME}"
fi

# Create docker volumes
if [ ! -z "${DOCKER_VOLUME_NAMES}" ]; then
    echo "Creating volumes..."
    for VOLUME_NAME in ${DOCKER_VOLUME_NAMES[@]}; do
        docker volume create "${VOLUME_NAME}"
    done
fi

# Copy scripts
echo "Copying scripts to ${OPT_DIR}..."
[ ! -d "${OPT_DIR}" ] && mkdir "${OPT_DIR}"
cp install.conf "${OPT_DIR}"
cp docker-compose.yml "${OPT_DIR}"
cp common.sh "${OPT_DIR}"
cp "${OPT_MAIN_SCRIPT}" "${OPT_DIR}"

sed -i 's/${DOCKER_CONTAINER_NAME}/'"${DOCKER_CONTAINER_NAME}"'/' "${OPT_DIR}/docker-compose.yml"
sed -i 's|${DOCKER_IMAGE_REPO}|'"${DOCKER_IMAGE_REPO}"'|' "${OPT_DIR}/docker-compose.yml"
sed -i 's/${DOCKER_IMAGE_TAG}/'"${DOCKER_IMAGE_TAG}"'/' "${OPT_DIR}/docker-compose.yml"

# Build container
echo "Finalizing installation..."
cd "${OPT_DIR}"
COMPOSE_HTTP_TIMEOUT=600 docker-compose up --no-start

echo "${APP_NAME} ${DOCKER_IMAGE_TAG} installed."

CURRENT_IMAGE_ID=$(docker images "${DOCKER_IMAGE_REPO}":"${DOCKER_IMAGE_TAG}" -q)
if [ -z "${CURRENT_IMAGE_ID}" ]; then
    echo "Warning: failed to obtain Docker image ID for ${DOCKER_IMAGE_REPO}:${DOCKER_IMAGE_TAG}!";
else
    REPO_OTHER_IMAGE_IDS=$(docker images "${DOCKER_IMAGE_REPO}" -q | grep -v "${CURRENT_IMAGE_ID}" || true)
    if [ ! -z "${REPO_OTHER_IMAGE_IDS}" ]; then
        echo "The following Docker images from repo '"${DOCKER_IMAGE_REPO}"' are found and not used by the plugin. They will be removed:"
        echo "--------------------"
        echo "$(docker image ls --format "{{.ID}}: {{.Repository}}:{{.Tag}}" "${DOCKER_IMAGE_REPO}" | grep -v "${CURRENT_IMAGE_ID}")"
        echo "--------------------"
        echo "${REPO_OTHER_IMAGE_IDS}" | while read IMAGE_ID ; do
            docker rmi --force "${IMAGE_ID}"
        done
    fi
fi

if [ "$START_ON_BUILD" == "1" ]; then
    echo "Starting server..."
    ./"${OPT_MAIN_SCRIPT}" start
fi
