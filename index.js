const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 9000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


let User = {
  firstName,
  lastName,
  socketName
};

var users = new Array(User);

io.on('connection', (socket) => {
  console.log("new  connection with id:" + socket.id);

  socket.on("message", msg => {
    console.log("Received message:" + msg);

    const { type, name, offer, answer, candidate } = data;
    let data = msg;

    //accepting only JSON messages
    /*
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
    }*/

    switch (type) {
      //when a user tries to login
      //a voir ce quon recup du microservice de login 
      case "login":
        //Check if username is available
        //users.push({ id: socket.id, name: msg.name });
        var name1 = msg.name;
        var name2 = msg.lastName;
        //register new user into Users => pas sur que ca marche
        users.push({ name1, name2 });
        //Send a msg to all user when a new user is connected
        io.emit("newUser", { id: socket.id, name: name });
        //verifier l'ordre ou faire un map entre socket et nom 
        socket.name = msg.name;

        break;
      case "offer":
        //if UserBexists then send him offer details
        const offerRecipient = msg.name;

        if (!!offerRecipient) {
          //setting that sender connected with recipient
          socket.otherName = name;

        }
        break;
      case "answer":
        //for ex. UserB answers UserA
        const answerRecipient = msg.name;

        if (!!answerRecipient) {
          socket.otherName = name;

        }
        break;
      case "candidate":
        const candidateRecipient = msg.name;

        if (!!candidateRecipient) {

        }
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
