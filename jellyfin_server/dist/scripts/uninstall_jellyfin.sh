#! /bin/bash

UNINSTALLING=1

[ -z "${BASE_DIR}" ] && . common.sh

if [ -d "${BASE_DIR}" ]; then
    rm -rf "${BASE_DIR}"
fi
