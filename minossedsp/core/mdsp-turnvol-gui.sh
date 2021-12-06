#!/bin/bash

RETV=$(/usr/local/bin/volumio volume)
NV=$(($RETV+$1))
/usr/local/bin/volumio volume "$NV"
