const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 9000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var users = new Array();
/*
const sendToAll = (clients, type, { id, name: userName }) => {
  Object.values(clients).forEach(client => {
    if (client.name !== userName) {
      client.send(
        JSON.stringify({
          type,
          user: { id, userName }
        })
      )
    }
  })
};
const sendTo = (connection, message) => {
  connection.send(JSON.stringify(message));
};*/
io.on('connection', (socket) => {
  console.log("new  connection with id:" + socket.id);
  socket.emit("getUsers", users);
  socket.on("message", msg => {
    console.log("Received message:" + msg);
    let data = msg;


    //accepting only JSON messages
    /*
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("Invalid JSON");
      data = {};
    }*/
    const { type, name, offer, answer, candidate } = data;
    switch (type) {
      //when a user tries to login
      case "login":
        //Check if username is available
        users.push({ id: socket.id, name: msg.name });

        socket.emit("newUser", { id: socket.id, name: name });


        if (users[name]) {
          /* sendTo(socket, {
             type: "login",
             success: false,
             message: "Username is unavailable"
           });*/
        } else {
          const id = 1;
          const loggedIn = Object.values(
            users
          ).map(({ id, name: userName }) => ({ id, userName }));

          users[name] = socket;
          socket.name = name;
          socket.id = id;

          sendTo(socket, {
            type: "login",
            success: true,
            users: loggedIn
          });
          // a changer pour les amis 
          sendToAll(users, "updateUsers", socket);
        }
        break;
      case "offer":
        //if UserBexists then send him offer details
        const offerRecipient = users[name];

        if (!!offerRecipient) {
          //setting that sender connected with recipient
          socket.otherName = name;
          sendTo(offerRecipient, {
            type: "offer",
            offer,
            name: socket.name
          });
        }
        break;
      case "answer":
        //for ex. UserB answers UserA
        const answerRecipient = users[name];

        if (!!answerRecipient) {
          socket.otherName = name;
          sendTo(answerRecipient, {
            type: "answer",
            answer
          });
        }
        break;
      case "candidate":
        const candidateRecipient = users[name];

        if (!!candidateRecipient) {
          sendTo(candidateRecipient, {
            type: "candidate",
            candidate
          });
        }
        break;
      case "leave":
        recipient = users[name];

        //notify the other user so he can disconnect his peer connection
        if (!!recipient) {
          recipient.otherName = null;
          sendTo(recipient, {
            type: "leave"
          });
        }
        break;
      default:
        sendTo(socket, {
          type: "error",
          message: "Command not found: " + type
        });
        break;
    }
  });

  socket.on("close", function () {
    if (socket.name) {
      delete users[socket.name];
      if (socket.otherName) {
        console.log("Disconnecting from ", socket.otherName);
        const recipient = users[socket.otherName];
        if (!!recipient) {
          recipient.otherName = null;
        }
      }
      sendToAll(users, "removeUser", socket);
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
