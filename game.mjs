import mongoose from "mongoose";
import './db.mjs';
import Deck from "./deck.mjs";
import { Guard, Priest, Baron, Handmaid, Prince, King, Countess, Princess } from "./cards.mjs";

const User = mongoose.model("User");
const Game = mongoose.model("Game");

function convertStringToCard(str) {
    let card;
    if(!str) {
        return;
    }
    switch (str.toLowerCase()) {
        case "guard":
            card = new Guard();
            break;
        case "priest":
            card = new Priest();
            break;
        case "baron":
            card = new Baron();
            break;
        case "handmaid":
            card = new Handmaid();
            break;
        case "prince":
            card = new Prince();
            break;
        case "king":
            card = new King();
            break;
        case "countess":
            card = new Countess();
            break;
        case "princess":
            card = new Princess();
            break;
        default:
            break;
    }
    return card;
}

function shufflePlayers(players) {
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }
    return players;
}

function convertCardToString(card) {
    return card.name;
}

function convertCDeck(cdeck) {
    const mdeck = [];
    for(let i = 0; i < cdeck.length; i++) {
        if(!cdeck[i]?.name) {
            break;
        }
        mdeck.push(convertCardToString(cdeck[i]));
    }
    return mdeck;
}

function convertDeckToGameInfo(deck) {
    return [convertCDeck(deck.deckOfCards), convertCDeck(deck.discardPile)];
}

export async function updateGame(roomcode, game, io) {
    await Game.findOneAndUpdate({roomcode: roomcode}, 
        {deckOfCards: game.deckOfCards, discardPile: game.discardPile, players: game.players, playHistory: game.playHistory}).then(() => {
            io.emit("chatBoxUpdate", {roomcode: roomcode, hist: game.playHistory});
        });
}


function concludeGame(winningPlayersIndex, roomcode, reason, io) {
    if(Array.isArray(winningPlayersIndex)) {
        Game.findOne({roomcode: roomcode}).then(async (game) => {
            const winnerNames = [];
            for(let i = 0; i < game.players.length; i++) {
                if(winningPlayersIndex.includes(i)) {
                    await User.findOneAndUpdate({ username: game.players[i].username },{ $inc: { winstreak: 1, wins: 1 }, ingame: false });
                    winnerNames.push(game.players[i].username);
                } else {
                    await User.findOneAndUpdate({username: game.players[i].username}, {winstreak: 0, ingame:false, $inc : {losses : 1}});
                }
            }
            io.emit("finishGame", {winner: winnerNames, reason: reason, roomcode: roomcode});
        });
    } else {
        Game.findOne({roomcode: roomcode}).then(async (game) => {
            await game.players.map(async (player) => {
                if(player.username === game.players[winningPlayersIndex].username) {
                    await User.findOneAndUpdate({ username: player.username },{ $inc: { winstreak: 1, wins: 1 }, ingame: false });
                } else {
                    await User.findOneAndUpdate({username: player.username}, {winstreak: 0, ingame:false, $inc : {losses : 1}});
                }
            });
            io.emit("finishGame", {winner: game.players[winningPlayersIndex].username, reason: reason, roomcode: roomcode});
        });
    }
}

export async function killPlayer(username, roomcode, io) {
    await Game.findOne({roomcode: roomcode}).then(async (game) => {
        const playerIndex = game.players.findIndex(player => player.username === username);
        game.discardPile.push(game.players[playerIndex].currCard);
        game.players[playerIndex].currCard = undefined;
        game.playHistory.push({username: "Admin", message: `${username} has died.`});
        await updateGame(game.roomcode, game, io);
    });
}

// Conclude deck doesn't work
export function changeTurn(roomcode, currPlayer, io) {
    Game.findOne({roomcode: roomcode}).then(game => {
        if(game.deckOfCards.length === 0) {
            let winnerIndex = [game.players.findIndex(player => player.currCard !== undefined)];
            for(let i = 0; i < game.players.length; i++) {
                if(game.players[i].currCard && convertStringToCard(game.players[i].currCard).num > convertStringToCard(game.players[winnerIndex[0]].currCard).num) {
                    winnerIndex = [i];
                } else if(game.players[i].currCard && convertStringToCard(game.players[i].currCard).num === convertStringToCard(game.players[winnerIndex[0]].currCard).num) {
                    winnerIndex.push(i);
                }
            }
            concludeGame(winnerIndex, roomcode, "They had the highest value card in hand after cards have run out.", io);
        } else {
            const alivePlayers = game.players.filter(player => player.currCard);
            if(alivePlayers.length === 1) {
                concludeGame(game.players.findIndex(player => player.currCard), roomcode, "They were the last one alive in the round", io);
            } else {
                let nextPlayerIndex = game.players.findIndex(player => player.username === currPlayer) + 1;
                if(game.players[nextPlayerIndex - 1]) {
                    game.players[nextPlayerIndex - 1].target = undefined;
                }
                if(nextPlayerIndex === game.players.length){
                    nextPlayerIndex = 0;
                }
                while(!game.players[nextPlayerIndex].currCard) {
                    nextPlayerIndex++;
                    if(nextPlayerIndex === game.players.length){
                        nextPlayerIndex = 0;
                    }
                }
                game.players[nextPlayerIndex].drawnCard = game.deckOfCards.pop();
                game.players[nextPlayerIndex].immune = false;
                updateGame(roomcode, game, io);
            }
            
        }
    });
}

class Player{
    constructor(io, socket){
        this.socket = socket;
        this.io = io;
        this.username = undefined;
        this.roomcode = undefined;
        this.playerNumber = -1;


        socket.on("disconnect", () => {
            this.disconnect();
        });

        socket.on("joinRoom", (roomcode) => {
            socket.join(roomcode);
            io.emit("roomUpdated");
        });

        socket.on("deleteLobby", (roomcode) => {
            Game.findOne({roomcode: roomcode}).then(async (game) => {
                if(game){
                    for(let i = 0; i < game.players.length; i++) {
                        await User.findOneAndUpdate({username: game.players[i].username}, {ingame: false});
                        await Game.findOneAndDelete({roomcode: roomcode}).then(io.emit("lobbyDeleted", (roomcode)));
                    }
                }
            });
        });

        socket.on("startGame", (roomInfo) => {
            this.createGame(roomInfo).then(io.emit("gameStart", (roomInfo.roomcode)));
        });

        socket.on("joinGame" , (info) => {
            this.username = info.username;
            this.roomcode = info.roomcode;
            Game.findOne({roomcode: this.roomcode}).then((game) => {
                for(let i = 0; i < game.players.length; i++) {
                    if(game.players[i].username === this.username) {
                        this.playerNumber = i;
                        break;
                    }
                }
            });
        });

        socket.on("leaveLobby", (roominfo) => {
            User.findOneAndUpdate({username: roominfo.name}, {ingame: false}).then((user) => {
                Game.findOneAndUpdate({roomcode: roominfo.game}, {$pull: {players: {username: user.username}}}).then(async (game) => {
                    if(game.players.length === 1) {
                        await Game.findOneAndDelete({roomcode: roominfo.game});
                    }
                    io.to(roominfo.roomcode).emit("updateRoom");
                });
            }); 
        });

        socket.on("currCard", () => {
            Game.findOne({roomcode: this.roomcode}).then( async(game) => {
                const theCard = convertStringToCard(game.players[this.playerNumber].currCard);
                game.playHistory.push({username: "Admin", message: `${this.username} has played their held card: ${game.players[this.playerNumber].currCard}`});
                game.players[this.playerNumber].currCard = game.players[this.playerNumber].drawnCard;
                game.players[this.playerNumber].drawnCard = null;
                await updateGame(game.roomcode, game, this.io).then(() => {
                    theCard.discard(this.username, this.roomcode);
                });
            });
        });

        socket.on("drawnCard", () => {
            Game.findOne({roomcode: this.roomcode}).then(async (game) => {
                const theCard = convertStringToCard(game.players[this.playerNumber].drawnCard);
                game.playHistory.push({username: "Admin", message: `${this.username} has played their drawn card: ${game.players[this.playerNumber].drawnCard}`});
                game.players[this.playerNumber].drawnCard = null;
                await updateGame(game.roomcode, game, this.io).then(() => {
                    theCard.discard(this.username, this.roomcode);
                });
            });
        });

        socket.on("giveUp", () => {
            Game.findOne({roomcode: this.roomcode}).then(async (game) => {
                // Should never happen
                if(game.players.length === 1) {
                    await User.findOneAndUpdate({username: this.username}, {winstreak: 0, $inc : {losses : 1}, ingame: false});
                    await Game.findOneAndDelete({roomcode: this.roomcode});
                } else {
                    const currNum = game.players.findIndex(player => player.username === this.username);
                    if(game.players[currNum].drawnCard) {
                        await changeTurn(this.roomcode, currNum, this.io);
                    }
                    game.players.splice(currNum, 1);
                    game.playHistory.push({username: "Admin", message: `${this.username} has left the game!`});
                    await User.findOneAndUpdate({username: this.username}, {winstreak: 0, $inc : {losses : 1}, ingame: false});
                    await updateGame(game.roomcode, game, this.io);
                    if(game.players.length === 1) {
                        concludeGame(0, this.roomcode, "They were the last one alive in the round", this.io);
                    } else {
                        await updateGame(game.roomcode, game, this.io);
                        socket.emit("leave");
                        io.emit("playerLeft", this.roomcode);
                    }   
                }                
            });
        });

        socket.on("targetSet", ({selectedPlayerName, cardName}) => {
            Game.findOne({roomcode: this.roomcode}).then(async (game) => {
                const selectedPlayer = game.players.find(player => player.username === selectedPlayerName);
                const currPlayer = game.players[this.playerNumber];
                if(cardName !== "Guard") {
                    game.players[this.playerNumber].target = undefined;
                }
                if(cardName === "Guard") {
                    socket.emit("guessNumber", selectedPlayerName);
                    game.players[this.playerNumber].target = selectedPlayerName;
                } else if(cardName === "Priest") {
                    const priestMsg = `(To you) ${selectedPlayerName} has a ${selectedPlayer.currCard}`;
                    game.playHistory.push({username: "Secret Teller", 
                        message: priestMsg, 
                        towards: this.username});
                    game.playHistory.push({username: "Admin", message: `${this.username} has looked at ${selectedPlayerName}'s hand.`});
                } else if(cardName === "Baron") {
                    game.playHistory.push({username: "Admin", message: `${this.username} is battling ${selectedPlayerName}.`});
                    const currPlayerCardNum = convertStringToCard(currPlayer.currCard).num;
                    const selectedPlayerNum = convertStringToCard(selectedPlayer.currCard).num;
                    game.playHistory.push({username: "Secret Teller", 
                        message: `(To you) ${selectedPlayerName} has a ${selectedPlayer.currCard}`, 
                        towards: this.username});
                    if(currPlayerCardNum < selectedPlayerNum){
                        killPlayer(currPlayer.username, this.roomcode, this.io);
                    } else if (currPlayerCardNum > selectedPlayerNum){
                        killPlayer(selectedPlayer.username, this.roomcode, this.io);
                    } else {
                        game.playHistory.push({username: "Admin", message: `They tied????`});
                    }
                } else if(cardName === "Prince") {
                    game.playHistory.push({username: "Admin", message: `${this.username} is discarding ${selectedPlayerName}'s hand.`});
                    game.playHistory.push({username: "Admin", message: `${selectedPlayerName} discarded a ${selectedPlayer.currCard}`});
                    if (selectedPlayer.currCard === "Princess") {
                        killPlayer(selectedPlayer.username, this.roomcode, this.io);
                    }
                    game.discardPile.push(selectedPlayer.currCard);
                    selectedPlayer.currCard = game.deckOfCards.pop();
                } else if(cardName === "King"){
                    game.playHistory.push({username: "Admin", message: `${this.username} has swapped their card with ${selectedPlayerName}.`});
                    if(currPlayer.currCard) {
                        const temp = currPlayer.currCard;
                        currPlayer.currCard = selectedPlayer.currCard;
                        selectedPlayer.currCard = temp;
                    } else {
                        const temp = currPlayer.drawnCard;
                        currPlayer.currCard = selectedPlayer.currCard;
                        selectedPlayer.currCard = temp;
                        currPlayer.drawnCard = null;
                    }
                }
                await updateGame(game.roomcode, game, this.io).then(() => {
                    if(cardName !== "Guard") {
                        changeTurn(game.roomcode, this.username, this.io);
                    }
                });
            });
        });

        socket.on("numberGuessed", ({card, selectedPlayerName}) => {
            Game.findOne({roomcode: this.roomcode}).then(async (game) => {
                const selectedPlayer = game.players.find(player => player.username === selectedPlayerName);
                game.playHistory.push({username: "Admin", message: `${this.username} guessed that ${selectedPlayerName} has a ${card}`});
                await updateGame(this.roomcode, game, this.io);
                if(card !== selectedPlayer.currCard) {
                    game.playHistory.push({username: "Admin", message: `${selectedPlayerName} did not have this card.`});
                    updateGame(this.roomcode, game, this.io).then(() => {
                    });
                } else {
                    await killPlayer(selectedPlayer.username, this.roomcode, this.io);
                }
                changeTurn(this.roomcode, this.username, this.io);
            });
        });

        socket.on("sendMessage", ({username, message}) => {
            Game.findOne({roomcode: this.roomcode}).then((game) => {
                game.playHistory.push({username: username, message: message});
                updateGame(this.roomcode, game, this.io);
            });
        });
    }

    async createGame(roomInfo) {
        await Game.findOneAndUpdate({roomcode: roomInfo.roomcode}, {started: true}).then(async(game) => {
            this.roomcode = game.roomcode;
            this.username = roomInfo.username;
            if(game.deckOfCards.length === 0)
            {
                const deck = new Deck();
                deck.createDeck();
                deck.shuffleDeck();
                deck.discard(deck.drawCard());
                [game.deckOfCards, game.discardPile] = convertDeckToGameInfo(deck);
            }
            for(let i = 0 ; i < game.players.length; i++) {
                if(!game.players[i].currCard) {
                    game.players[i].currCard = game.deckOfCards.pop();
                }
            }
            this.socket.join(this.roomcode);
            game.players = shufflePlayers(game.players);
            await updateGame(game.roomcode, game, this.io).then(() => {
                this.startGame(this.roomcode).then(() => {
                    this.io.to(this.roomcode).emit("updateVisuals", game.players.map(player => player.username));
                });
            });
        });
    }

    async startGame(roomcode) {
        await Game.findOne({roomcode: roomcode}).then(async (game) => {
            game.players.find(player => player.name === this.name).drawnCard = game.deckOfCards.pop();
            game.playHistory.push({username: "Admin", message: "Game has started!"});
            await updateGame(game.roomcode, game, this.io);
        });
    }

    
    disconnect() {
        
    }
}

export default function play(io) {
    io.on("connection", (socket) => {
        new Player(io, socket);
    });
}