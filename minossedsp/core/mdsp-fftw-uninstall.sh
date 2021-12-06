#!/bin/bash

FFTWVER="3.3.10"

SRCDIR="/usr/local/src/"
FFTWDIR="/data/INTERNAL/minossedsp/fftw-""$FFTWVER"
BINDIR="/usr/local/bin/"

#mdsp-logo.sh

/usr/bin/sudo /bin/echo ''

/usr/bin/sudo /bin/rm -v -r -f "$SRCDIR"fftw-"$FFTWVER"
/usr/bin/sudo /bin/rm -v -r -f "$FFTWDIR"
/usr/bin/sudo /bin/rm -v -r -f "$BINDIR"fftw*

#/usr/bin/sudo /bin/sed -i -e 's=# Multiarch support\n'"$FFTWDIR"'/lib=# Multiarch support=g' /etc/ld.so.conf.d/x86_64-linux-gnu.conf
#/usr/bin/sudo /bin/sed -i -e 's='"$FFTWDIR"'/lib==g' /etc/ld.so.conf.d/x86_64-linux-gnu.conf
/usr/bin/sudo /bin/cp -v -f /etc/ld.so.conf.d/x86_64-linux-gnu.conf.bak /etc/ld.so.conf.d/x86_64-linux-gnu.conf

/usr/bin/sudo ldconfig

/bin/echo "
====== sudo ldconfig -v | head -20 ======"
/usr/bin/sudo ldconfig -v | /usr/bin/head -20

#/bin/echo "
#====== ldd /usr/local/src/brutefir-1.0o/brutefir ======"
#/usr/bin/ldd /usr/local/src/brutefir-1.0o/brutefir

/bin/echo "
====== Removing old FFTW wisdom files ======"
/bin/rm -v -f /data/INTERNAL/minossedsp/fftw-wisdom/mdsp-*

/bin/echo "
====== ldd /usr/lib/brutefir/brutefir.real ======"
/usr/bin/ldd /usr/lib/brutefir/brutefir.real
