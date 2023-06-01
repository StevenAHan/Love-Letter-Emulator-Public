import {killPlayer, changeTurn, updateGame} from "./game.mjs";
import {getIO} from "./server.mjs";
import mongoose from "mongoose";
import "./db.mjs";

const Game = mongoose.model("Game");

export default class Card {
    constructor(name, desc, num, img) {
        this.name = name;
        this.desc = desc;
        this.num = num;
        this.img = img;
        this.io = getIO();
    }
}


export class Guard extends Card {
    constructor() {
        super("Guard", "Name a number other than 1 and choose another player."
            + "\nIf they have that number in their hand, they are knocked out of the round.", 1, "Guard.jpg");
    }

    async discard(currPlayer, roomcode) {
        await Game.findOne({roomcode: roomcode}).then(game => {
            const user = game.players.find(player => player.username === currPlayer);
            user.target = this.name;
            updateGame(roomcode, game, this.io);
        });
    }
}

export class Priest extends Card {
    constructor() {
        super("Priest", "Look at another player's hand.", 2, "Priest.jpg");
    }

    async discard(currPlayer, roomcode) {
        await Game.findOne({roomcode: roomcode}).then(game => {
            const user = game.players.find(player => player.username === currPlayer);
            user.target = this.name;
            updateGame(roomcode, game, this.io);
        });
    }
}

export class Baron extends Card {
    constructor() {
        super("Baron", "You and another player secretly compare hands. "
            + "\nThe player with the lower value is out of the round.", 3, "Baron.jpg");
    }

    async discard(currPlayer, roomcode) {
        await Game.findOne({roomcode: roomcode}).then(game => {
            const user = game.players.find(player => player.username === currPlayer);
            user.target = this.name;
            updateGame(roomcode, game, this.io);
        });
    }
}

export class Handmaid extends Card {
    constructor() {
        super("Handmaid", "Until your next turn, "
            + "ignore all effects from the other players' cards.", 4, "Handmaid.jpg");
    }

    async discard(currPlayer, roomcode) {
        await Game.findOne({roomcode: roomcode}).then(async (game) => {
            const user = game.players.find(player => player.username === currPlayer);
            user.immune = true;
            user.target = undefined;
            await updateGame(roomcode, game, this.io);
            await changeTurn(roomcode, currPlayer, this.io);
        });
    }
}


export class Prince extends Card {
    constructor() {
        super("Prince", "Choose any player (including yourself) "
        + "to discard his or her hand and draw a new card.", 5, "Prince.jpg");
    }

    async discard(currPlayer, roomcode) {
        await Game.findOne({roomcode: roomcode}).then(game => {
            const user = game.players.find(player => player.username === currPlayer);
            user.target = this.name;
            updateGame(roomcode, game, this.io);
        });
    }
}

export class King extends Card {
    constructor() {
        super("King", "Trade hands with another player of your choice.", 6, "King.jpg");
    }

    async discard(currPlayer, roomcode) {
        await Game.findOne({roomcode: roomcode}).then(game => {
            const user = game.players.find(player => player.username === currPlayer);
            user.target = this.name;
            updateGame(roomcode, game, this.io);
        });
    }
}
//
export class Countess extends Card {
    constructor() {
        super("Countess", "If you have this card and the King or Prince in your hand, "
        + "you must discard this card.", 7, "Countess.jpg");
    }

    async discard(currPlayer, roomcode) {
        changeTurn(roomcode, currPlayer, this.io);
    }
}

export class Princess extends Card {
    constructor() {
        super("Princess", "If you discard this card, you are out of the round.", 8, "Princess.jpg");
    }

    async discard(currPlayer, roomcode) {
        await killPlayer(currPlayer, roomcode, this.io);
        await changeTurn(roomcode, currPlayer, this.io);
    }
}