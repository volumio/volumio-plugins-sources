#!/bin/bash

### Minosse folders
export minosse_plugin_folder="/data/plugins/audio_interface/minossedsp/"
export minosse_data_folder="/data/INTERNAL/minossedsp/"
export minosse_bin_folder="/usr/local/bin/"
export minosse_src_folder="/usr/local/src/"

### Brutefir folders
export brutefir_folder="$minosse_src_folder"brutefir-1.0o/				# Remember to change mdsp-bf.service as well
export brutefir_bin_file="$minosse_src_folder"brutefir-1.0o/brutefir	# Remember to change mdsp-bf.service as well
export brutefir_conf_file="$minosse_data_folder"mdsp-bfconf.txt			# Remember to change mdsp-bf.service as well
export brutefir_fftw_wisdom_folder="$minosse_data_folder"fftw-wisdom/
export brutefir_in_fifo_folder="/usr/local/etc/minossedsp/"				# Remember to change mpd.conf.tmpl as well

### Filter/coefficient folders
export coefficient_folder="$minosse_data_folder"filters/
