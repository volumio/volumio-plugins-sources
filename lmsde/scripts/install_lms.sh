#! /bin/bash

INSTALLING=1

[ -z "${LMS_DIR}" ] && . common.sh
check_root

START_ON_BUILD="0";

. lms-docker-image.conf

echo "Installing Logitech Media Server ${LMS_DOCKER_IMAGE_TAG}..."

# Check if container already exists
# If so, remove it
if [ "$(docker ps -a --format '{{.Names}}' | grep logitechmediaserver)" ]; then
    # If this is an update, and if the container is running, we 
    # set START_ON_BUILD to "1", so that it gets started
    # when it is rebuilt. This is because Volumio does not
    # restart the plugin when it is updated (but then, it doesn't
    # refresh the updated plugin files, so user should still reboot)
    START_ON_BUILD="$(is_running)"
    echo "LMS Docker container already exists. Removing it first..."
    docker rm --force logitechmediaserver
fi

# Create docker volumes
echo "Creating volumes..."
docker volume create logitechmediaserver-config
docker volume create logitechmediaserver-music
docker volume create logitechmediaserver-playlist

# Copy scripts
echo "Copying scripts to ${LMS_DIR}..."
[ ! -d "${LMS_DIR}" ] && mkdir "${LMS_DIR}"
cp docker-compose.yml "${LMS_DIR}"
cp common.sh "${LMS_DIR}"
cp lms.sh "${LMS_DIR}"

sed -i 's|${LMS_DOCKER_IMAGE_REPO}|'"${LMS_DOCKER_IMAGE_REPO}"'|' "${LMS_DIR}/docker-compose.yml"
sed -i 's/${LMS_DOCKER_IMAGE_TAG}/'"${LMS_DOCKER_IMAGE_TAG}"'/' "${LMS_DIR}/docker-compose.yml"

# Build container
echo "Finalizing installation..."
cd "${LMS_DIR}"
COMPOSE_HTTP_TIMEOUT=600 docker-compose up --no-start

echo "Logitech Media Server ${LMS_DOCKER_IMAGE_TAG} installed."

CURRENT_LMS_IMAGE_ID=$(docker images "${LMS_DOCKER_IMAGE_REPO}":"${LMS_DOCKER_IMAGE_TAG}" -q)
if [ -z "${CURRENT_LMS_IMAGE_ID}" ]; then
    echo "Warning: failed to obtain ID of LMS Docker image!";
else
    OTHER_LMS_IMAGE_IDS=$(docker images "${LMS_DOCKER_IMAGE_REPO}" -q | grep -v "${CURRENT_LMS_IMAGE_ID}" || true)
    if [ ! -z "${OTHER_LMS_IMAGE_IDS}" ]; then
        echo "The following LMS Docker images are found and not used by the plugin. They will be removed:"
        echo "--------------------"
        echo "$(docker image ls --format "{{.ID}}: {{.Repository}}:{{.Tag}}" "${LMS_DOCKER_IMAGE_REPO}" | grep -v "${CURRENT_LMS_IMAGE_ID}")"
        echo "--------------------"
        echo "${OTHER_LMS_IMAGE_IDS}" | while read IMAGE_ID ; do
            docker rmi --force "${IMAGE_ID}"
        done
    fi
fi

if [ "$START_ON_BUILD" == "1" ]; then
    echo "Starting server..."
    ./lms.sh start
fi
