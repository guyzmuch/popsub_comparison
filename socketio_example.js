var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
var rooms = {

}

var sockets = {

}
// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index_socket.html');
});
app.get('/room1', function (req, res) {
  res.sendfile(__dirname + '/index_socket_room1.html');
});
app.get('/room2', function (req, res) {
  res.sendfile(__dirname + '/index_socket_room2.html');
});
app.get('/room3', function (req, res) {
  res.sendfile(__dirname + '/index_socket_room3.html');
});



app.post('/broadcast', function (req, res) {
  io.emit('general_event', req.body.data);
});

io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function(data) {
        pseudo = ent.encode(data.pseudo);
        socket.pseudo = data.pseudo
        socket.room = data.room

        if (!rooms[data.room]){
          rooms[data.room] = {
            users: [],
            message: [],
          }
        }
        rooms[data.room].users.push(socket.pseudo)
        sockets[socket.pseudo] = data.room


    
        socket.on('disconnect', function () {
          delete sockets[socket.pseudo]
          for (let i=0, iLen = rooms[socket.room].users.length; i < iLen; i++){
            if (rooms[socket.room].users[i] === socket.pseudo){
              rooms[socket.room].users.splice(i, 1)
            }
          }
          socket.broadcast.emit('leave_client_room_'+socket.room, socket.pseudo);
          socket.broadcast.emit('users_room_'+socket.room, rooms[socket.room].users);
        });
    
        socket.on('message_room_'+socket.room, function (message) {
            message = ent.encode(message);
            socket.broadcast.emit('message_room_'+socket.room, {pseudo: socket.pseudo, message: message});
        });


        socket.broadcast.emit('nouveau_client_room_'+socket.room, socket.pseudo);
        socket.broadcast.emit('users_room_'+socket.room, rooms[socket.room].users);
    });


});

server.listen(8080);
