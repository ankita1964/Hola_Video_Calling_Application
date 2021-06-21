const socket = io('/');
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
})

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id); 
})

 
const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    console.log("Connect ki request bhj di yaha se");
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    })
}

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video);
}

