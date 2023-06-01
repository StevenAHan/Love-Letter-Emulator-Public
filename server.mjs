import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from "mongoose";
import './db.mjs';
import session from "express-session";
import socketio from "socket.io";
import http from "http";
import play from "./game.mjs";
import cors from "cors";
import cookieParser from "cookie-parser";

const User = mongoose.model("User");
const Game = mongoose.model("Game");

const app = express();
const sessionOptions = {
    secret: "session secret",
    saveUninitialized: true,
    resave: true
};
const server = http.createServer(app);

// socket.io
const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    }
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  };
play(io);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

export function getIO() {
    return io;
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

app.use(express.urlencoded({ extended: false }));

app.use(session(sessionOptions));

app.post("/s", (req, res) => {
    if(req.body.tokenUser && req.body.tokenUser !== "undefined") {
        User.findOne({username: req.body.tokenUser}).then(user => {
            req.session.user = user;
            res.send({user: req.session.user, token: {user: req.session.user?.username, ingame: req.session.user?.ingame}});
        });
    }
});

app.get("/lobbys", (req,res) => {
    const theUser = req.session?.user;
    if(!req.session.user) {
        res.send({"error": 1});
    } else if(req.query.roomno === undefined) {
        Game.findOne({players: {$elemMatch: {username: req.session.user.username}}}).then(game => {
            if(game) {
                if(game.started) {
                    res.send({started: true, game: game});
                } else {
                    User.findOneAndUpdate({username: theUser.username}, {ingame: true}).then((user) => {
                        res.send({"host": (user.username === game.players[0].username), "game": game.toObject()});
                    });
                }
            } else {
                let code = generateId(4);
                Game.find({}).then(games => {
                    const codes = [];
                    games.map(game => {
                        codes.push(game.roomcode);
                    });
                    while (codes.includes(code)) {
                        code = generateId(4);
                    }
                    const newGame = new Game({
                        roomcode: code,
                        players: [{username: theUser.username, currCard: null, drawnCard: null, immune: false, target: undefined}],
                        deckOfCards: [],
                        discardPile: [],
                        playHistory: [],
                        started: false
                    });
                    newGame.save().then(() => User.findOneAndUpdate({username: theUser.username}, {ingame: true}))
                        .then(() => res.send({"host": "true", "game": newGame.toObject()}));
                });
            }
        });
    }
    else {
        Game.findOne({roomcode: req.query.roomno}).then(room => {
            if(!room) {
                res.send({"exists": false});
            } else if(room.started) {
                res.send({"started": true});
            } else {
                const playerNames = room.players.map(player => player.username);
                if(room === undefined) {
                    res.send({});
                    return;
                } else if (!playerNames.includes(req.session.user.username)){
                    Game.findOneAndUpdate({roomcode: req.query.roomno}, {$push:{players:{username: req.session.user.username, currCard: null, drawnCard: null, immune: false, target: undefined}}},).then(game => {
                        if (room.players[0].username === req.session.user.username) {
                            User.findOneAndUpdate({username: req.session.user?.username}, {ingame: true}).then(() => res.send({"host": "true", "game": game}));
                        } else {
                            User.findOneAndUpdate({username: req.session.user?.username}, {ingame: true}).then(() => res.send({"host": "false", "game": game}));
                        }
                    });
                } else if(room.players[0].username === req.session.user?.username) {
                    res.send({"host": "true", "game": room});
                } else {
                    res.send({"host": "false", "game": room});
                }
            }
        });
    }    
});

app.post("/joingames", (req,res) => {
    Game.findOne({roomcode: req.body.roomcode}).then(room => {
        if(!room) {
            res.send({"alert": "Game not found!"});
        } else if(room.started && !room.players.filter(player => player.username === req.session.user.username)){
            res.send({"alert": "Game already started!"});
        } else if(room.players.length >= 4) {
            res.send({"alert":"Lobby is Full!"});
        } else {
            res.send({});
        }
    });
});

app.post("/logins", (req,res) => {
    if(req.body.submit === "Register") {
        User.findOne({username: req.body.user}).then(user => {
            if(!user) {
                const account = new User({
                    username: req.body.user,
                    password: req.body.pass,
                    wins: 0, 
                    losses: 0, 
                    winstreak: 0
                });
                account.save().then(req.session.user = account).then(res.send({token: {user: req.session.user.username, ingame: req.session.user.ingame}}));
            } else {
                const alert = "Username already taken! Please use a new username.";
                res.send({"alert": alert});
            }
        });
    }
    else {
        User.findOne({username: req.body.user}).then(user => {
            if(user) {
                user.comparePassword(req.body.pass, (err, matches) => {
                    if (err){
                        throw err;
                    } else if(matches) {
                        req.session.user = user;
                        res.send({token: {user: req.session.user.username, ingame: req.session.user.ingame}});
                    } else {
                        const alert = "Password or Username is Incorrect! Try again.";
                        res.send({"alert": alert});
                    }
                });
            } else {
                const alert = "Password or Username is Incorrect! Try again.";
                res.send({"alert": alert});
            }
        });
    }
});

app.get("/profiles", (req,res) => {
    res.send({"user": req.session.user});
});

app.post('/profiles', (req,res) => {
    if(req.body.submit === "Logout") {
        req.session.user = undefined;
        res.send({token: "undefined"});
    } else if(req.body.submit === "DeleteAccount") {
        User.findOneAndDelete({username: req.session.user.username}).then(() => {
            req.session.user = undefined;
            res.send({token: "undefined"});
        });
    }
});

app.get("/otherProfs/:slug", (req,res) => {
    User.findOne({username: req.params.slug}).then(user => {
        res.send({"user": user});        
    });
});


app.get("/games", (req,res) => {
    Game.findOne({roomcode: req.query.roomno}).then((game) => {
        res.send({game: game});
    });
});

app.get("/wins", (req,res) => {
    Game.findOne({roomcode: req.query.roomcode}).then((game) => {
        res.send({gameExists:(game) ? true: false, game: game});
    });
});

app.get("/rematch", (req,res) => {
    Game.findOne({roomcode: req.query.roomcode}).then(game => {
        if(!game) {
            const newGame = new Game({
                roomcode: req.query.roomcode,
                players: [{username: req.query.user, currCard: null, drawnCard: null, immune: false, target: undefined}],
                deckOfCards: [],
                discardPile: [],
                playHistory: [],
                started: false
            });
            newGame.save().then((game) => {
                Game.findOne({roomcode: game.roomcode}).then(game => {
                    if(game) {
                        res.send({result: "roomMade"});
                    }
                });
            });
        } else {
            res.send({result: "roomTaken"});
        }
    });
});

if(process.env.NODE_ENV === 'production'){    
    app.use(express.static('frontend/build'));
    app.get('*',(req,res)=>{     
        res.sendFile(path.resolve(__dirname,'frontend','build', 'index.html' ));    
    });
}

const port = process.env.PORT || 5000;
server.listen(port);