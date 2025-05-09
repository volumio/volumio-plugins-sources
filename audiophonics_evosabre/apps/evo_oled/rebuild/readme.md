# This is not meant to be executed on end-user devices. 

This subpackage exposes the ```npm run rebuild``` method, which builds binaries for node native addon "spi-device" and move the relevant output files in .../bin/*node-abi*

The method should be used in the ```project_root/rebuild directory``` before packaging the plugin or module.

The rebuild method requires a basic compilation toolchain, so at least ```build-essential``` package is required.