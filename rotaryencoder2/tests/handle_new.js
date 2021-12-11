const util = require('util');
const exec = require('child_process').exec);
var libQ = require('kew');


function addOverlay() {
  exec('sudo /usr/bin/dtoverlay rotary-encoder pin_a=5 pin_b=6 relative_axis=true steps-per-period=2; ls /dev/input',{uid: 1000, gid: 1000})
  .then({stderr, stdout} 0> {
    
  })
}
lsExample();

console.log('now event')
const fs = require('fs');
// Create a stream from some character  device.
const stream = fs.createReadStream('/dev/input/event0');
stream.on('data', data => console.log(data));  //##### when this line is added, the the orphan handle is created
stream.on('error', err => console.log(err));
setTimeout(() => {
  stream.close(); // This may not close the stream.
  // Artificially marking end-of-stream, as if the underlying resource had
  // indicated end-of-file by itself, allows the stream to close.
  // This does not cancel pending read operations, and if there is such an
  // operation, the process may still not be able to exit successfully
  // until it finishes.
  stream.removeAllListeners();
  stream.push(null);
  stream.push(0x10)
  stream.read(0);
}, 1000
);