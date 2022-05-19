#! /bin/bash

[ -z "$JELLYFIN_DIR" ] && . common.sh
check_root

START_ON_BUILD="0";

echo "Installing Jellyfin server..."

# Check if Jellyfin container already exists
# If so, remove it
if [ "$(docker ps -a --format '{{.Names}}' | grep jellyfin)" ]; then
    # If this is an update, and if the container is running, we 
    # set START_ON_BUILD to "1", so that it gets started
    # when it is rebuilt. This is because Volumio does not
    # restart the plugin when it is updated (but then, it doesn't
    # refresh the updated plugin files, so user should still reboot)
    START_ON_BUILD="$(is_running)"
    echo "Jellyfin Docker container already exists. Removing it first..."
    docker rm --force jellyfin
fi

# Create docker volumes
echo "Creating volumes..."
docker volume create jellyfin-config
docker volume create jellyfin-cache

# Copy scripts
echo "Copying scripts to $JELLYFIN_DIR..."
[ ! -d "$JELLYFIN_DIR" ] && mkdir "$JELLYFIN_DIR"
cp docker-compose.yml "$JELLYFIN_DIR"
cp common.sh "$JELLYFIN_DIR"
cp jellyfin.sh "$JELLYFIN_DIR"

# Build container
echo "Finalizing installation..."
cd "$JELLYFIN_DIR"
COMPOSE_HTTP_TIMEOUT=600 docker-compose up --no-start

echo "Jellyfin server installed."

if [ "$START_ON_BUILD" == "1" ]; then
    echo "Starting server..."
    ./jellyfin.sh start
fi
