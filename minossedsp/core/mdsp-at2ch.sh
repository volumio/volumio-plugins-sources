#!/bin/bash

NCH=""
if [[ "$1" == "2.0" ]]; then NCH="2"
elif [[ "$1" == "2.1" || "$1" == "4.0" ]]; then NCH="4"
elif [[ "$1" == "4.1" || "$1" == "6.0" ]]; then NCH="6"
elif [[ "$1" == "6.1" || "$1" == "8.0" ]]; then NCH="8"
fi

/bin/echo "$NCH"
