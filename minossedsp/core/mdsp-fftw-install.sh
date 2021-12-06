#!/bin/bash -e

FFTWVER="3.3.10"

VUSER="volumio"
VGROUP="volumio"
SRCDIR="/usr/local/src/"
FFTWDIR="/data/INTERNAL/minossedsp/fftw-""$FFTWVER"
BINDIR="/usr/local/bin/"

#mdsp-logo.sh

_deps() {
	
	/usr/bin/sudo /bin/echo ''
	
	/usr/bin/sudo /usr/bin/apt-get update
	/usr/bin/sudo /usr/bin/apt-get -y install make build-essential
}

_libs() {
	
	/usr/bin/sudo /bin/echo ''
	
	### Edit /etc/ld.so.conf.d/x86_64-linux-gnu.conf
	if [[ $(/usr/bin/sudo /bin/cat /etc/ld.so.conf.d/x86_64-linux-gnu.conf | /bin/grep "$FFTWDIR") == "" ]]
	then
		/usr/bin/sudo /bin/cp -v -f /etc/ld.so.conf.d/x86_64-linux-gnu.conf /etc/ld.so.conf.d/x86_64-linux-gnu.conf.bak
		/usr/bin/sudo /bin/sed -i -e 's=# Multiarch support=# Multiarch support\n'"$FFTWDIR"'/lib=g' /etc/ld.so.conf.d/x86_64-linux-gnu.conf
		#/usr/bin/sudo ldconfig
	fi
}

#_deps

### Too much screen output seems to cast trouble when called from install.sh, so use " > /dev/null 2>&1"

cd "$SRCDIR"
#/usr/bin/sudo /usr/bin/wget http://www.fftw.org/fftw-"$FFTWVER".tar.gz
/usr/bin/sudo /usr/bin/wget ftp://ftp.fftw.org/pub/fftw/fftw-"$FFTWVER".tar.gz > /dev/null 2>&1
#/usr/bin/sudo /bin/tar -xvzf fftw-"$FFTWVER".tar.gz  > /dev/null 2>&1
/usr/bin/sudo /bin/tar -xzf fftw-"$FFTWVER".tar.gz > /dev/null 2>&1
/usr/bin/sudo /bin/rm -v -f fftw-"$FFTWVER".tar.gz > /dev/null 2>&1
/usr/bin/sudo /bin/chown -R "$VUSER":"$VGROUP" fftw-"$FFTWVER" > /dev/null 2>&1
cd fftw-"$FFTWVER"

### Compile for float precision
#/usr/bin/sudo /usr/bin/make clean
#./configure --enable-sse2 --disable-fortran --enable-float --enable-shared --prefix="$FFTWDIR"
#./configure --enable-avx --enable-sse --disable-doc --enable-silent-rules --disable-fortran --enable-float --enable-shared --prefix="$FFTWDIR"
#/usr/bin/sudo /usr/bin/make CFLAGS="-march=native -mtune=native" install

### Compile for double precision
#/usr/bin/sudo /usr/bin/make clean
#./configure --enable-sse2 --disable-fortran --enable-shared --prefix="$FFTWDIR"
./configure --enable-avx2 --enable-sse2 --disable-doc --enable-silent-rules --disable-fortran --enable-shared --prefix="$FFTWDIR" > /dev/null 2>&1
/usr/bin/sudo /usr/bin/make CFLAGS="-march=native -mtune=native" install

### volumio path: /usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
### root path: /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
### default fftw wisdom files are in /usr/bin/
/usr/bin/sudo /bin/cp -v -f "$FFTWDIR"/bin/fftw* "$BINDIR"

_libs

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
