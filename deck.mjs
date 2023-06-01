import { Guard, Priest, Baron, Handmaid, Prince, King, Countess, Princess } from "./cards.mjs";

export default class Deck {
    constructor(deckOfCards=[],discardPile=[]) {
        this.deckOfCards = deckOfCards;
        this.discardPile = discardPile;
    }

    createDeck() {
        for(let i = 0; i < 5; i++) {
            this.deckOfCards.push(new Guard());
        }
        this.deckOfCards.push(new Priest());
        this.deckOfCards.push(new Priest());
        this.deckOfCards.push(new Baron());
        this.deckOfCards.push(new Baron());
        this.deckOfCards.push(new Handmaid());
        this.deckOfCards.push(new Handmaid());
        this.deckOfCards.push(new Prince());
        this.deckOfCards.push(new Prince());
        this.deckOfCards.push(new King());
        this.deckOfCards.push(new Countess());
        this.deckOfCards.push(new Princess());
    }

    deleteDeck() {
        this.deckOfCards = [];
    }

    deleteDiscardPile() {
        this.discardPile = [];
    }

    reset() {
        this.deleteDeck();
        this.deleteDiscardPile();
    }

    shuffleDeck() {
        for (let i = this.deckOfCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.deckOfCards[i], this.deckOfCards[j]] = [this.deckOfCards[j], this.deckOfCards[i]];
        }
    }

    drawCard() {
        return this.deckOfCards.pop();
    }

    discard(card) {
        this.discardPile.push(card);
    }
}