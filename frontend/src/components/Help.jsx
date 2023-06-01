import React, { useState } from 'react';
import Guard from "../imgs/Guard.jpg";
import Priest from "../imgs/Priest.jpg";
import Baron from "../imgs/Baron.jpg";
import Handmaid from "../imgs/Handmaid.jpg";
import Prince from "../imgs/Prince.jpg";
import King from "../imgs/King.jpg";
import Countess from "../imgs/Countess.jpg";
import Princess from "../imgs/Princess.jpg";

const Help = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  const resetSelectedCard = () => {
    setSelectedCard(null);
  };

  const renderCardButtons = () => {
    const cards = [
      { image: Guard, alt: 'Guard' },
      { image: Priest, alt: 'Priest' },
      { image: Baron, alt: 'Baron' },
      { image: Handmaid, alt: 'Handmaid' },
      { image: Prince, alt: 'Prince' },
      { image: King, alt: 'King' },
      { image: Countess, alt: 'Countess' },
      { image: Princess, alt: 'Princess' },
    ];

    return cards.map((card, index) => (
      <button
        key={index}
        className="helpButton"
        onClick={() => handleCardClick(card)}
      >
        <img src={card.image} alt={card.alt} className="helpCards" />
      </button>
    ));
  };

  const renderZoomedCard = () => {
    if (selectedCard) {
      return (
        <div className="zoomedCardOverlay" onClick={resetSelectedCard}>
          <div className="zoomedCardContainer">
            <img
              src={selectedCard.image}
              alt={selectedCard.alt}
              className="zoomedCard"
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="cover"></div>
            <h1 className="black-text">How to Play (From Wikipedia):</h1>
            <p className="black-text minimized">At the start of each round, one card is discarded face-down (so the process of elimination cannot be used to prove which cards are left for the round), one card is dealt to each player and the rest are deposited face-down into a deck in the middle. During each player's turn, one card is drawn from the deck and the player gets to play either that card or the card already in their hand. After processing the effect described on the played card, the next player to the left gets a turn. This process is repeated until either the deck runs out, in which case the player holding the highest-value card wins the round, or all players but one are eliminated, in which case the last player still in play wins the round.</p>
            <h3 className="black-text">Number of Cards:</h3>
            <p className="black-text ">5 x Guards | 2 x Priests, Barons, Handmaids, Princes | 1 x King, Countess, Princess | 16 cards total</p>
            <h3 className="black-text">List of Cards (click to zoom in): </h3>
            <br/>
      <div id="help">{renderCardButtons()}</div>
      {renderZoomedCard()}
    </div>
  );
};

export default Help;