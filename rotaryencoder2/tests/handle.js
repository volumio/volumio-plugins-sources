const log = require('why-is-node-running');  //only used to list out handles blocking the end of the script
const fs = require('fs');
const EventEmitter = require('events');

class InputEvent extends EventEmitter {
  constructor(device, options) {
    super();
    Object.assign(this, {
      device,
      flags: 'r',
      encoding: null
    }, options);
    this.on('raw', data => console.log(data));
    this.fd = fs.openSync(this.device, this.flags);
    this.input = fs.createReadStream(null, this);
    this.input.on('data', data => console.log(data));  //##### when this line is added, the the orphan handle is created
    console.log('Listeners #:',this.input.listenerCount('data'));  // >>> 1  
    this.input.removeAllListeners();                  // even removing the listener again does not help
    console.log('Listeners #:',this.input.listenerCount('data'));  // >>> 0
    this.input.on('error', err => {
        console.log(err);
    });
  }

  close(callback) {
    this.input.close();
    this.input.push(null);
    this.input.read(0);
  }
}

myEvent = new InputEvent('/dev/input/event0');


setTimeout(()=>{
    myEvent.close
  },1000)

setTimeout(()=>{
    log();
  },2000)