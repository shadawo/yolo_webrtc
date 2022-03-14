const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 9000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


let User = {
  userName,
  socketId
};

var users = new Array(User);

function loofForUserSocketId(name) {
  var i = 0;
  while (name != users[i].name) {
    i++;
  }
  return users[i].socketId;
}
function lookForUserName(id) {
  var i = 0;
  while (id != users[i].socketId) {
    i++;
  }
  return users[i].name;
}
io.on('connection', (socket) => {
  console.log("new  connection with id:" + socket.id);

  socket.on("message", msg => {
    console.log("Received message:" + msg);

    const { type, name, offer, answer, candidate } = data;
    let data = msg;


    switch (type) {
      //when a user tries to login
      //a voir ce quon recup du microservice de login 
      case "login":
        //Check if username is available
        //users.push({ id: socket.id, name: msg.name });
        var userName = msg.name;
        var socketId = socket.id;
        //register new user into Users => pas sur que ca marche
        users.push({ userName, socketId });
        //Send a msg to all user when a new user is connected
        io.emit("newUser", { name: userName });

        break;
      case "offer":
        //pas de test d'erreur
        //Get the recipient socketId
        let recipientSocketId = loofForUserSocketId(msg.name);
        //Get the sender name
        let senderName = lookForUserName(socket.id);
        //send the offer to the recipient 
        io.to(recipientSocketId).emit("offer", senderName);

        break;
      case "answer":

        //Get the recipient socketId
        let recipientSocketId1 = loofForUserSocketId(msg.name);
        //Get the sender name
        let senderName1 = lookForUserName(socket.id);
        //send the answer to the recipient 
        io.to(recipientSocketId1).emit("answer", senderName1);

        break;
      case "candidate":
        //Get the recipient socketId
        let recipientSocketId2 = loofForUserSocketId(msg.name);
        //send the answer to the recipient 
        io.to(recipientSocketId2).emit("iceCanditate", msg.candidate);

        break;
      case "leave":
        recipient = msg.name;

        //notify the other user so he can disconnect his peer connection
        if (!!recipient) {
          recipient.otherName = null;

        }
        break;
      default:

        break;
    }
  });

  socket.on("close", function () {
    if (socket.name) {
      delete users[socket.name];
      if (socket.otherName) {
        console.log("Disconnecting from ", socket.otherName);
        //send to all user that this socket is deconnected
        io.emit("userLeave", socket.name);
        if (!!recipient) {
          recipient.otherName = null;
        }
      }


    }
  });
  //send immediatly a feedback to the incoming connection
  socket.send(
    JSON.stringify({
      type: "connect",
      message: "Well hello there, I am a WebSocket server"
    })
  );
});



http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
