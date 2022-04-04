var socket = io();
var userName = "patoche" + Math.random();

socket.emit("request", msg = { type: "login", name: userName });



/*
var firstName = ...
var lastName = ...
*/

var userList = new Array();
var callee;
var options = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
}
var caller;
var pcCaller;
var pcCallee;
var dataChannel;

function messageReceive(dataChannel) {
    dataChannel.addEventListener("message", event => {
        console.log("Message received : " + event.data);
        let divMsg = document.getElementById("receiver");
        divMsg.innerHTML += `
        <div class="message-text">
                 ${event.data}
                </div>
        `;
    });
}
function sendMessage(dataChannel, message) {
    if (dataChannel.readyState == "open") {
        dataChannel.send(message);
        let divMsg = document.getElementById("sender");
        divMsg.innerHTML += `
        <div class="message-text">
                  ${message}
                </div>
        `;
    }
}

/*
    const stream = navigator.mediaDevices.getUserMedia({ audio: true });
 
    var pcCaller = new RTCPeerConnection(options);;
    const audioTrack = stream.getTracks().array.forEach(track => {
     pcCaller.addTrack(track, stream);
    });;
 
*/


var cells = document.getElementById("cells");
socket.on("getUsers", users => {
    for (let i = 0; i < users.length; i++) {
        addUsers(users[i]);
    }
});

function addUsers(user) {
    userList.push(user);
    let id = userList.length;
    //Add to the list of user on the UI 
    let contactList = document.getElementById("contactList");
    contactList.innerHTML += `
      <div class="conversation" id="user${id}">
        <img src="images/pers.png" />
        <h2>${user}</h2>
        <p><button class="offerButton" id="${user}">Make an offer</button></p>
      </div>
      `

    /*
    cells.innerHTML += `<div id = "user${id}" > ${user}
    <button class="offerButton" id="${user}">Make an offer</button>
                        </div > `
  */
}

socket.on("newUser", user => {
    addUsers(user);
});

socket.on("connectedUsers", usersAlreadyConnected => {
    for (let i = 0; i < usersAlreadyConnected.length; i++) {
        addUsers(usersAlreadyConnected[i]);
    }
});

//'''''''''''''''''''''''''''Caller side''''''''''''''''''''''''''''''''//

// callee accepted the offer 
socket.on("answer", async receiverName => {
    //création sdp et envoi de sdp puis de ICE
    //côté caller
    callee = receiverName;
    console.log("Connexion accepté de :" + receiverName);

    //Creating the caller peer connection and his sdp
    if (pcCaller == undefined) {
        pcCaller = new RTCPeerConnection();
        dataChannel = pcCaller.createDataChannel("dataChannel");
        //console.log(dataChannel);
    }


    pcCaller.addEventListener('connectionstatechange', event => {
        console.log("connection ?")
        if (pcCaller.connectionState === 'connected') {
            // Peers connected!
            messageReceive(dataChannel);
            console.log("GGWP peers connected!");
        }
    });

    var CallerSdp = await pcCaller.createOffer({ iceRestart: true });
    //Sending the caller sdp to the callee  
    socket.emit("request", { type: "sdpCaller", name: receiverName, sdp: CallerSdp, dc: dataChannel })
    //Setting the caller (his) local description
    await pcCaller.setLocalDescription(CallerSdp);
});
//Waiting for callee sdp 

// when callee send spd info
socket.on("calleeSdp", async calleeSdp => {
    //Caller set callee description
    const remoteDesc = new RTCSessionDescription(calleeSdp);
    console.log(pcCaller.iceGatheringState);
    await pcCaller.setRemoteDescription(remoteDesc);
    console.log("callee descripiton set");
    console.log(remoteDesc);

    //navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    //pcCaller.addStream(localStream);

    //Then 
    //Caller listen to his peerconnection for some icecandidate and when one is found the caller send it to the callee 

    console.log(pcCaller.iceGatheringState);



    pcCaller.addEventListener('icecandidate', event => {

        if (event.candidate != null) {
            console.log("ice candidate found");
            console.log(event.candidate);
            socket.emit("request", { type: 'iceCandidateToCallee', name: callee, candidate: event.candidate });
        }
    });

    dataChannel.addEventListener("open", ev => {
        const readyState = dataChannel.readyState;
        console.log("Send channel state is: " + readyState);
        sendMessage(dataChannel, "coucou bro 2");
    });
    dataChannel.addEventListener("error", ev => {
        console.log(ev);
    });




    // Listen for connectionstatechange on the local RTCPeerConnection



});



socket.on('calleeIceCandidate', async calleeIceCandidate => {
    console.log(calleeIceCandidate);
    if (calleeIceCandidate) {
        //Try to add the caller ice candidate 
        try {
            await pcCaller.addIceCandidate(calleeIceCandidate);
            console.log("callee ice cadidate added");
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});


//-----------------------------Callee side----------------------------------//

// callee received an offer from the caller 
socket.on("offer", senderName => {
    console.log("Demande de connexion de:" + senderName);
    displayOffer(senderName);
    //cells.innerHTML += `<button class=acceptButton id = ${senderName}> Accept offer send by:${senderName}</button >`;
});


//receiving a peerConnection offer from the caller (send by the signaling server)
socket.on("pcOffer", async (callerSdp, dc) => {
    //creating the callee peer connection
    pcCallee = new RTCPeerConnection();
    // dataChannel = dc;
    // console.log(dc);
    pcCallee.addEventListener("datachannel", ev => {
        dataChannel = ev.channel;

        console.log("datachannel ? : ");
        console.log(dataChannel);

        sendMessage(dataChannel, "coucou bro");
        messageReceive(dataChannel);

    }, false);
    //messageReceive(dataChannel);
    //Setting the caller sdp description
    await pcCallee.setRemoteDescription(callerSdp);
    console.log("caller description set:");
    console.log(callerSdp);

    pcCallee.addEventListener('icecandidate', event => {

        if (event.candidate != null) {
            console.log("ice candidate found");
            console.log(event.candidate);
            socket.emit("request", { type: 'iceCandidateToCaller', name: callee, candidate: event.candidate });
        }
    });
    //Creating the callee sdp answer 
    var calleeSdp = await pcCallee.createAnswer();
    pcCallee.setLocalDescription(calleeSdp);

    //Sending the callee sdp to the caller 
    socket.emit("request", { type: "sdpCallee", name: caller, sdp: calleeSdp })

});

//Signaling server emiting caller ice candidate 
socket.on('callerIceCandidate', async callerIceCandidate => {
    console.log(callerIceCandidate);
    if (callerIceCandidate) {
        //Try to add the caller ice candidate 
        try {
            await pcCallee.addIceCandidate(callerIceCandidate);
            console.log("caller ice cadidate added");
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }

    // searching for callee candidate 

});




/////////////////////////////////////////////////////////////////////////////////////////

socket.on("disconnection", senderName2 => {

});

const acceptButton = document.getElementsByClassName("Accept");
document.addEventListener('click', function (e) {
    if (e.target && e.target.className == 'offerButton') {
        //Caller sending his offer to the callee 
        socket.emit("request", { type: "offer", name: e.target.id });
        console.log(e.target.id);
    }
    if (e.target && e.target.className == 'acceptButton') {
        console.log(e.target);
        let divModal = document.getElementById("offer").style.display = "none";
        //callee accepted the offer and sending back his answer to the caller 
        socket.emit("request", { type: "answer", name: e.target.id });
        console.log(e.target.id);
        caller = e.target.id;
    }

});


