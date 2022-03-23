const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 9000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});



var users = new Array();

function loofForUserSocketId(name) {
  let i = 0;
  for (i; i < users.length; i++) {
    if (users[i].userName == name) {
      return users[i].socketId;
    }
  }
  return null;
}

function getUsersNames() {
  let usersNames = new Array();
  for (let i = 0; i < users.length; i++) {
    usersNames.push(users[i].userName);
  }
  return usersNames;
}

function lookForUserName(socketId) {
  let i = 0;
  for (i; i < users.length; i++) {
    if (users[i].socketId == socketId) {
      return users[i].userName;
    }
  }
  return null;
}
io.on('connection', (socket) => {
  console.log("new  connection with id:" + socket.id);

  socket.on("request", msg => {
    console.log("Received message:" + msg.type);

    let data = msg;
    const { type, name, offer, answer, candidate, sdp } = data;



    switch (type) {
      //when a user tries to login

      case "login":

        let userName = msg.name;
        let socketId = socket.id;
        console.log("name :" + userName + "\n" + "id : " + socketId);
        //send the list of users already connected
        socket.emit("connectedUsers", getUsersNames());
        //register new user into Users => pas sur que ca marche
        users.push({ userName, socketId });
        //Send a msg to all user when a new user is connected

        socket.broadcast.emit("newUser", userName);
        break;
      case "offer":

        //Get the recipient socketId
        let recipientSocketId = loofForUserSocketId(msg.name);
        //Get the sender name
        let senderName = lookForUserName(socket.id);

        if (senderName != null && recipientSocketId != null) {
          console.log("User : " + senderName + " sending to " + recipientSocketId);
          //send the offer to the recipient 
          io.to(recipientSocketId).emit("offer", senderName);
        }

        break;
      case "answer":

        //Get the recipient socketId
        let recipientSocketId1 = loofForUserSocketId(msg.name);
        //Get the sender name
        let senderName1 = lookForUserName(socket.id);
        if (senderName1 != null && recipientSocketId1 != null) {
          //send the answer to the recipient 
          io.to(recipientSocketId1).emit("answer", senderName1);
        }

        break;
      case "sdpCaller":

        //Get the recipient socketId
        let recipientSocketId4 = loofForUserSocketId(msg.name);
        //send the sdp to the recipient 
        if (msg.name != null && recipientSocketId4 != null) {
          io.to(recipientSocketId4).emit("pcOffer", msg.sdp);
        }
        break;

      case "sdpCallee":
        //Get the recipient socketId
        let recipientSocketId5 = loofForUserSocketId(msg.name);
        //send the sdp to the recipient 
        if (msg.name != null && recipientSocketId5 != null) {
          io.to(recipientSocketId5).emit("calleeSdp", msg.sdp);
        }
        break;

      case "iceCandidate":

        //Get the recipient socketId
        let recipientSocketId2 = loofForUserSocketId(msg.name);
        //send the iceCandidate to the recipient 
        if (msg.name != null && recipientSocketId2 != null) {
          io.to(recipientSocketId2).emit("CallerIceCandidate", msg.candidate);
        }

        break;
      case "leave":

        let recipientSocketId3 = loofForUserSocketId(msg.name);
        let senderName2 = lookForUserName(socket.id);
        //notify the other user so he can disconnect his peer connection
        io.to(recipientSocketId3).emit("disconnection", senderName2);


        break;
      default:
        console.log("Error in switch");

        break;
    }
  });

  socket.on("close", function () {
    let index = 0;
    if (socket.id != users[index].socketId) {
      index++;
    }
    else {
      io.emit("userLeave", users[index].name);
      delete users[index];
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
