const socket = io('http://localhost:3030/');
const videoGrid = document.getElementById('video-grid');
var peer = new Peer(undefined, {
    host: '/',
    port: '3001'
})

let myVideoStream;
const myVideo = document.createElement(`video`);
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
    video: true,
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

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id); 
})

 
const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    })
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
        setUnmuteButton();
    } else {
        setMuteButton();
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
}

const stopButton = () => { 
    const ele = `<i class="fas fa-video-slash"></i>`;
    document.querySelector(".video").innerHTML = ele;
}