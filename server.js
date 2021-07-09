// Requiring necessary libraries for the project
const express = require("express")
const app = express();
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { v4:uuidv4 } = require("uuid")
const { ExpressPeerServer} = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

// Requiring the libraries for Google Authentication
const {OAuth2Client} = require('google-auth-library');
const cookieParser = require("cookie-parser");
const CLIENT_ID = "401680115319-ljth2d92o4tt9uboa3ffmsnc8fia707f.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// Setting up the middlewares for less confusion
app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// This is the root route where the user will land for
// the first time 
app.get('/', (req,res) => {
    res.redirect("home");
    // res.redirect(`/${uuidv4()}`);
})

// Rendering the home page with this route
app.get("/home", (req,res) => {
    res.render("home");
})

// Setting up the authentication middleware function
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

// Setting up the authentication redirect middleware function
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

// Rendering the dashboard if checkAuthenticated is successfull
app.get("/dashboard", checkAuthenticated, (req,res) => {
    res.render("dashboard");
})

// Rendering the loginpage if checkAuthenticated is successfull
app.get("/login", checkAuthenticatedRedirect, (req,res) => {
    res.render("login")
})

// Does the verification of the user when the user logins 
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

// Logs out the user and redirects to the home page
app.get("/logout", (req,res) => {
    res.clearCookie('session-token');
    res.redirect("/home");
})

// Creates a new room only if the user is authenticated
app.get("/newRoom", checkAuthenticated, (req, res) => {
    res.redirect(`/${uuidv4()}`)
})

// Lets a user join a room only if the user is authenticated
app.get("/joinRoom", checkAuthenticated, (req, res) => {
    res.redirect(`/${req.query.joinRoomId}`)
})

// Renders the meeting room page only if the user is authenticated 
app.get('/:room', checkAuthenticated, (req,res) => {
    res.render('room', { roomId: req.params.room})
})

// Establishing all the socket connections and emitting
// all the responses to the front end
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

// Listening to port 3030
server.listen(process.env.PORT || 3030);