const express = require("express")
const app = express();
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { v4:uuidv4 } = require("uuid")
const { ExpressPeerServer} = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

const {OAuth2Client} = require('google-auth-library');
const cookieParser = require("cookie-parser");
const CLIENT_ID = "401680115319-ljth2d92o4tt9uboa3ffmsnc8fia707f.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

//
app.get('/', (req,res) => {
    res.redirect("home");
    // res.redirect(`/${uuidv4()}`);
})

app.get("/home", (req,res) => {
    res.render("home");
})

// app.get('/', (req,res) => {
//     res.redirect(`/${uuidv4()}`);
// })

const checkAuthenticated = (req,res,next) => {
    let token = req.cookies['session-token'];

    let user = {}
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        // const userid = payload['sub'];  
        user.name = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
      }
      verify()
      .then(() => {
        req.user = user;
        next();
      })
      .catch(err => {
          res.redirect('/login');
      });
}

const checkAuthenticatedRedirect = (req,res,next) => {
    let token = req.cookies['session-token'];

    let user = {}
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        user.name = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
      }
      verify()
      .then(() => {
        req.user = user;
        res.redirect('/dashboard');
    })
    .catch(err => {
        next();
      });
}

app.get("/dashboard", checkAuthenticated, (req,res) => {
    res.render("dashboard");
})

app.get("/login", checkAuthenticatedRedirect, (req,res) => {
    res.render("login")
})

app.post("/login", (req,res) => {
    let token = req.body.token;

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];  
      }
      verify()
      .then(() => {
          res.cookie('session-token', token);
          res.send("success");
      })
      .catch(console.error);
})

app.get("/logout", (req,res) => {
    res.clearCookie('session-token');
    res.redirect("/home");
})

app.get("/newRoom", checkAuthenticated, (req, res) => {
    res.redirect(`/${uuidv4()}`)
})


app.get("/joinRoom", checkAuthenticated, (req, res) => {
    res.redirect(`/${req.query.joinRoomId}`)
})

app.get('/:room', checkAuthenticated, (req,res) => {
    res.render('room', { roomId: req.params.room})
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message);
        })
        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
    })
})
server.listen(process.env.PORT || 3030);