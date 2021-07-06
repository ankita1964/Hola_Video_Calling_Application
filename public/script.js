// Deployed the application on Heroku
const socket = io('/');
const videoGrid = document.getElementById('video-grid1');
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
})

const peers = {}
let myVideoStream;
const myVideo = document.createElement(`video`);
myVideo.muted = true;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let today = new Date();
let date = today.getDate() + " " + monthNames[today.getMonth()] + " " + today.getFullYear(); 
let time = (today.getHours()<10 ? "0"+today.getHours() : today.getHours()) + " : " + today.getMinutes();
console.log(date + " and " + time);
document.querySelector(".dateAndTime").textContent = time + " | " + date;

setInterval( ()=> {
    let today = new Date();
    let date = today.getDate() + " " + monthNames[today.getMonth()] + " " + today.getFullYear(); 
    let time = (today.getHours()<10 ? "0"+today.getHours() : today.getHours()) + " : " + today.getMinutes()  + " : " + today.getSeconds();
    document.querySelector(".dateAndTime").textContent = time + " | " + date;
}, 1000)

navigator.mediaDevices.getUserMedia({
    video: {
        aspectRatio: { ideal: 0.83333},
    },
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        })
    })


    socket.on('user-connected', (userId) => {
        setTimeout( () => {
            connectToNewUser(userId, stream);
        }, 1000);
    })

    socket.on('createMessage', message => {
    $('.messages').append(`<li class="message"> <b> User </b> </br> ${message}</li>`)
    scrollToBottom();
})
})

socket.on('user-disconnected', (userId) => {
    // console.log(userId);
    if(peers[userId]) peers[userId].close();
})

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id); 
})

 
const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    })

    call.on('close', () => {
        video.remove(); 
    })

    peers[userId] = call
}

const addVideoStream = (video,stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video);
}


let text = $('input');

$('html').keydown( (e) => {
    if(e.which == 13 && text.val().length !== 0) {
        socket.emit('message', text.val());
        text.val('');
    }
});


const scrollToBottom = () => {
    let d = $('.main__chatWindow');
    d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setMuteButton();
    } else {
        setUnmuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const setUnmuteButton = () => { 
    const ele = `<i class="fas fa-microphone"></i>`;
    document.querySelector(".audio").innerHTML = ele;
}

const setMuteButton = () => { 
    const ele = `<i class="fas fa-microphone-slash"></i>`;
    document.querySelector(".audio").innerHTML = ele;
}

const playStopVideo = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    
    if (enabled) {
        // const tracks = stream.getTracks();
    
        // tracks.forEach(function(track) {
        //     track.stop();
        // });
    
        // video.srcObject = null;
        myVideoStream.getVideoTracks()[0].enabled = false;
        stopButton();
    } else {
        playButton();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const playButton = () => { 
    const ele = `<i class="fas fa-video"></i>`;
    document.querySelector(".video").innerHTML = ele;
    document.querySelector("video").style.opacity = "1";
    
}

const stopButton = () => { 
    const ele = `<i class="fas fa-video-slash"></i>`;
    let videoElement = document.querySelector("video");
    videoElement.style.opacity = "0.5";
    // document.querySelector("h3").style.opacity = "1";
    document.querySelector(".video").innerHTML = ele;
}

if(document.querySelector(".tile").length == 2) {
    document.querySelector("h3").style.marginLeft = "3em"
}

let brbToggle = false;
const brbButton = () => {
    if(brbToggle==false) {
        const enabled1 = myVideoStream.getVideoTracks()[0].enabled;
        if (enabled1) {
            myVideoStream.getVideoTracks()[0].enabled = false;
            let videoElement = document.querySelector("video");
            videoElement.style.opacity = "0.5";
            document.querySelector("h3").style.opacity = "1";
            stopButton();
        }

        const enabled2 = myVideoStream.getAudioTracks()[0].enabled;
        if (enabled2) {
            myVideoStream.getAudioTracks()[0].enabled = false;
            setMuteButton();
        }

        document.querySelector(".brb").style.background = "#e63023";
        brbToggle = true;
    }
    else {
        const enabled1 = myVideoStream.getVideoTracks()[0].enabled;
        if (!enabled1) {
            myVideoStream.getVideoTracks()[0].enabled = true;
            document.querySelector("video").style.opacity = "1";
            document.querySelector("h3").style.opacity = "0";
            playButton();
        }

        const enabled2 = myVideoStream.getAudioTracks()[0].enabled;
        if (!enabled2) {
            myVideoStream.getAudioTracks()[0].enabled = true;
            setUnmuteButton();
        }
        document.querySelector(".brb").style.background = "transparent";
        brbToggle = false;
    }
}