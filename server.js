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
  let i = 0;
  for (i;i<users.length();i++){
    if(users[i].userName == name){
      return users[i].socketId;
    }
  }
  return null;
  
}
function lookForUserName(id) {
  let i = 0;
  for (i;i<users.length();i++){
    if(users[i].socketId == socketId){
      return users[i].userName;
    }
  }
  return null;
}
io.on('connection', (socket) => {
  console.log("new  connection with id:" + socket.id);

  socket.on("request", msg => {
    console.log("Received message:" + msg);

    const { type, name, offer, answer, candidate } = data;
    let data = msg;


    switch (type) {
      //when a user tries to login
      
      case "login":

        let userName = msg.name;
        let socketId = socket.id;
        //register new user into Users => pas sur que ca marche
        users.push({ userName, socketId });
        //Send a msg to all user when a new user is connected
        socket.broadcast.emit("newUser", userName );

        break;
      case "offer":

        //Get the recipient socketId
        let recipientSocketId = loofForUserSocketId(msg.name);
        //Get the sender name
        let senderName = lookForUserName(socket.id);

        if(senderName != null && recipientSocketId != null){
        //send the offer to the recipient 
        io.to(recipientSocketId).emit("offer", senderName);
        }

        break;
      case "answer":

        //Get the recipient socketId
        let recipientSocketId1 = loofForUserSocketId(msg.name);
        //Get the sender name
        let senderName1 = lookForUserName(socket.id);
        if(senderName1 != null && recipientSocketId1 != null){
        //send the answer to the recipient 
        io.to(recipientSocketId1).emit("answer", senderName1);
        }

        break;
      case "candidate":

        //Get the recipient socketId
        let recipientSocketId2 = loofForUserSocketId(msg.name);
        //send the answer to the recipient 
        if(msg.name != null && recipientSocketId2 != null){
        io.to(recipientSocketId2).emit("iceCanditate", msg.candidate);
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
      else{ 
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
