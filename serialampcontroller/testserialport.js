// To get a default set of Bindings and Parsers
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

SerialPort.list().then(
  ports => ports.forEach(function(item){
    console.log(item.manufacturer + ": "+ item.pnpId + " (" + item.path +")")
  }),
  err => console.error(err)
)

//{"autoOpen":false,"lock":true,"baudRate":115200,"dataBits":8,"stopBits":1,"parity":"none","rtscts":false,"xon":false,"xoff":false,"xany":false}
serialOptions = {autoOpen: true, lock: true};
serialOptions.baudRate = 115200;
serialOptions.dataBits = 8;
serialOptions.stopBits = 1;
serialOptions.parity = "none";
serialOptions.rtscts = false;
serialOptions.xon = false;
serialOptions.xoff = false;
serialOptions.xany = false;

function output(params) {
  console.log(params)
}

const port = new SerialPort('/dev/ttyUSB0', serialOptions,function (err) {
// const port = new SerialPort('/dev/ttyUSB0', {
//   baudRate: 115200
// }, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
})

const parser = port.pipe(new Readline({ delimiter: '$' }))
parser.on('data', output)

// Read data that is available but keep the stream in "paused mode"
// port.on('readable', function () {
//   console.log('Data:', port.read())
// })

// Switches the port into "flowing mode"
// port.on('data', function (data) {
//   console.log('Data:', data)
// })

// // Pipe the data into another stream (like a parser or standard out)
// const lineStream = port.pipe(new Readline())

setTimeout(() => {
  port.write("mute!",'ascii',function(err) {
    console.log(err);
  })  
}, 1000);
