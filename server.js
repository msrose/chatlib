const express = require('express');
const {Server} = require('http');
const socketio = require('socket.io');
const {replaceRandomNounAllSentences} = require('.');

const app = express();
const server = Server(app);
const io = socketio(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('message', (message) => {
    console.log('got a message: %s', message);
    const changed = replaceRandomNounAllSentences(message);
    console.log('changed message to: %s', message);
    socket.broadcast.emit('message', changed);
  });
});

server.listen(1337);
