const io = require('socket.io-client');
var socket = io.connect('http://localhost:3000');

socket.on('connection', () => {
  console.log('Connected')
});

socket.on('error', (e) => {
    console.log('ERROR: ' + e)
})

socket.on('message', (data) => {
  console.log(data);
});

socket.on('pushMethod', data => {
    console.log(data)
})

// socket.emit('play')
var obj = JSON.parse("{\"endpoint\":\"system_hardware/eadog_lcd\",\"method\":\"up\",\"data\":\"\"}")
// var obj = JSON.parse('{"endpoint":"music_service/spotify","method":"onStart","data":{}}')
// var obj = JSON.parse('{"endpoint":"system_hardware/lol","method":"lol","data":""}')
socket.emit('callMethod',obj)