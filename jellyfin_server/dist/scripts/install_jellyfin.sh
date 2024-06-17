#! /bin/bash

INSTALLING=1

[ -z "${BASE_DIR}" ] && . common.sh

install_pkg() {
    if [ -d "${BIN_DIR}" ]; then
        echo_dt "${BIN_DIR} already exists. Skipping package download and installation."
        return 0
    fi

    ARCH="$(dpkg --print-architecture)"

    if [ "${ARCH}" == "amd64" ] || [ "${ARCH}" == "armhf" ]; then
        PKG_NAME="jellyfin_${TARGET_VERSION}-${ARCH}.tar.gz"
        PKG_URL="https://repo.jellyfin.org/files/server/linux/stable/v${TARGET_VERSION}/${ARCH}/${PKG_NAME}"
    fi

    if [ -z "${PKG_URL}" ]; then
        echo_dt "Installation cannot proceed: Invalid architecture \"${ARCH}\""
        (exit 1)
    fi

    PKG_TMP="$(mktemp --suffix ".tar.gz")"
    echo_dt "Downloading package from ${PKG_URL}; saving to ${PKG_TMP}..."
    wget -O "${PKG_TMP}" "${PKG_URL}"

    mkdir -p "${BASE_DIR}"
    chmod 755 "${BASE_DIR}"

    echo_dt "Uncompressing package to ${BASE_DIR}..."
    tar xzf "${PKG_TMP}" -C "${BASE_DIR}"

    rm "${PKG_TMP}"

    echo_dt "Setting up directories..."
    mkdir -p "${DATA_DIR}" "${CACHE_DIR}" "${CONFIG_DIR}" "${LOG_DIR}"

    echo_dt "Checking directories..."
    if [ -d "${BIN_DIR}" ]; then
        return 0
    fi
    if [ -d "${BASE_DIR}/jellyfin" ]; then
        echo_dt "Rename \"${BASE_DIR}/jellyfin\" to \"${BIN_DIR}\""
        mv "${BASE_DIR}/jellyfin" "${BIN_DIR}"
    fi
}

install_ffmpeg() {
    echo_dt "Installing ffmpeg..."

    apt-get update && apt-get install -y ffmpeg
}

create_systemd_service() {
    echo_dt "Setting up systemd service..."

    DEST_FILE="/etc/systemd/system/jellyfin.service"
    WORK_FILE="$(mktemp)"

    cp jellyfin.service.template "${WORK_FILE}"
    
    sed -i 's|${BIN_DIR}|'"${BIN_DIR}"'|' "${WORK_FILE}"
    sed -i 's|${DATA_DIR}|'"${DATA_DIR}"'|' "${WORK_FILE}"
    sed -i 's|${CACHE_DIR}|'"${CACHE_DIR}"'|' "${WORK_FILE}"
    sed -i 's|${CONFIG_DIR}|'"${CONFIG_DIR}"'|' "${WORK_FILE}"
    sed -i 's|${LOG_DIR}|'"${LOG_DIR}"'|' "${WORK_FILE}"

    cp "${WORK_FILE}" "${DEST_FILE}"
    systemctl daemon-reload
}

install_pkg
install_ffmpeg
create_systemd_service
