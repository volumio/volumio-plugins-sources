// To get a default set of Bindings and Parsers
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

SerialPort.list().then(
  ports => ports.forEach(function(item){
    console.log(item.manufacturer + ": "+ item.pnpId)
  }),
  err => console.error(err)
)

const port = new SerialPort('/dev/ttyUSB0', {
  baudRate: 115200

},function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
})

const parser = port.pipe(new Readline({ delimiter: '$' }))
parser.on('data', console.log)

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

port.write("mute!",'ascii',function(err) {
  console.log(err);
})