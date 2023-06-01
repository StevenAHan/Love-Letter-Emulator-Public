import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useSearchParams } from "react-router-dom";
import useToken from "./useToken.jsx";
import ErrorLoading from './ErrorLoading.jsx';
import Guard from "../imgs/Guard.jpg";
import Priest from "../imgs/Priest.jpg";
import Baron from "../imgs/Baron.jpg";
import Handmaid from "../imgs/Handmaid.jpg";
import Prince from "../imgs/Prince.jpg";
import King from "../imgs/King.jpg";
import Countess from "../imgs/Countess.jpg";
import Princess from "../imgs/Princess.jpg";

const Game = ({socket}) => {
    const { token } = useToken();
    const [backendData, setBackendData] = useState([{}]);
    const [searchParams] = useSearchParams();
    const [yourIndex, setYourIndex] = useState(-1);
    const [guide, setGuide] = useState(false);
    const [playerList, setPlayerList] = useState([]);
    const [currCard, setCurrCard] = useState(null);
    const [drawnCard, setDrawnCard] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [playerButton , setPlayerButton] = useState([]);
    const cards = ["Guard", "Priest", "Baron", "Handmaid", "Prince", "King", "Countess", "Princess"];
    const bottomRef = useRef(null);
    const msgRef = useRef(null);
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
            className="guideButton"
            onClick={() => handleCardClick(card)}
        >
            <img src={card.image} alt={card.alt} className="guideCards" />
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

    useEffect(() => {
        const convertNametoImg = (name) => {
            if(name === "Guard") {
                return <img className="selectImg" src={Guard} alt="card" />;
            } else if(name === "Priest") {
                return <img className="selectImg" src={Priest} alt="card" />;
            } else if(name === "Baron") {
                return <img className="selectImg" src={Baron} alt="card" />;
            } else if(name === "Handmaid") {
                return <img className="selectImg" src={Handmaid} alt="card" />;
            } else if(name === "Prince") {
                return <img className="selectImg" src={Prince} alt="card" />;
            } else if(name === "King") {
                return <img className="selectImg" src={King} alt="card" />;
            } else if(name === "Countess") {
                return <img className="selectImg" src={Countess} alt="card" />;
            } else if(name === "Princess") {
                return <img className="selectImg" src={Princess} alt="card" />;
            }
        }

        function targetPlayer(user) {
            if(user && backendData.game) {
                socket.emit("targetSet", {selectedPlayerName: user, cardName: backendData.game.players[yourIndex].target});                
            }
        }

        const updateRoomData = () => {
            fetch(`/games${window.location.search}`).then(response => response.json()).then(data => {
                if(data.game.players.find(player=> player.username === token.user)) {
                    setBackendData(data);
                    getPlayerList(data);
                    getPlayerButton(data);
                    setYourIndex(data.game.players.findIndex(player => player.username === token.user));
                    setCurrCard(convertNametoImg(data.game.players[yourIndex]?.currCard));
                    setDrawnCard(convertNametoImg(data.game.players[yourIndex]?.drawnCard));
                    showMessages(data.game.playHistory);
                }
            });
        }

        const getPlayerList = (backendData) => {
            const playersComp = backendData.game?.players.map(player => {
                return <h5>{player.username} ({(player.currCard) ? ((player.immune) ? ("immune") : ("alive")): ("dead")})</h5>;
            });
            setPlayerList(playersComp);
        }
        const getPlayerButton = (backendData) => {
            const playersComp = [];
            backendData.game?.players.map(player => {
                if(player.currCard && !player.immune){
                    playersComp.push(<button className="btn btn-primary btn-lg text-white" key={`button-${player.username}`} onClick={() => targetPlayer(player.username)}>
                        {player.username}{(player.username === token.user) ? (" (you)") : ("")}
                        </button>);
                }
                return player;
            });
            setPlayerButton(playersComp);
        }

        const showMessages = (msg) => {
            let msgList = [];
            msg.map((message) => {
                if(!message.towards || message.towards === token.user) {
                    if(message.username === "Secret Teller"){
                        msgList.push(<div className="message nameArea primary"><p>{message.username}</p><p className="text">{message.message}</p></div>);
                    } else if(message.username === "Admin") {
                        msgList.push(<div className="message nameArea secondary"><p>{message.username}</p><p className="text">{message.message}</p></div>);
                    } else {
                        msgList.push(<div className="message nameArea"><p>{message.username}</p><p className="text">{message.message}</p></div>);
                    }
                }
                return message;
            });
            setMessages(msgList);
        }

        function joinGame() {
                socket.emit("joinGame", {username: searchParams.get("player"), roomcode: searchParams.get("roomno")});
        }

        updateRoomData();
        
        if(socket){
            joinGame();

            socket.on("finishGame", ({winner, reason, roomcode}) => {
                if(backendData.game.roomcode === roomcode) {
                    window.location.href = `/win?roomcode=${backendData.game.roomcode}&winner=${winner}&reason=${reason}`;
                }
            });

            socket.on("leave", () => {
                window.location.href = "/";
            });

            socket.on("chatBoxUpdate", ({roomcode, hist}) => {
                if(backendData.game.roomcode === roomcode) {
                    showMessages(hist);
                    bottomRef.current?.scrollIntoView({behavior: 'smooth'});
                }
            });

            socket.on("playerLeft", roomcode => {
                if(backendData.game.roomcode === roomcode) {
                    joinGame();
                }
            });

            return () => {
                socket.off("finishGame");
                socket.off("leave");
                socket.off("chatBoxUpdate");
                socket.off("playerLeft");
              };
        }
    }, [socket, searchParams, token, yourIndex, backendData]);

    function toggleGuide() {
        setGuide(!guide);
    }

    function guessCard(card) {
        socket.emit("numberGuessed", {card: card, selectedPlayerName: backendData.game.players[yourIndex].target});
    }

    function playCurrCard() {
        socket.emit("currCard");
    }

    function playDrawnCard() {
        socket.emit("drawnCard");
    }

    function giveUp() {
        socket.emit("giveUp");
        // alert("You can't give up!");
    }

    function handleMessageSend() {
        socket.emit("sendMessage", {username: token.user, message: message});
        msgRef.current.value = "";
        setMessage("");
    }
    
    return (
        <div>
            
            {(!token) ? (
                <Navigate to="/login"/>
            )  : (
                <div className="full-screen">
                    {(!backendData.game) ? (
                        <ErrorLoading/>
                    ) : (
                        <div>
                            <div className="gameCover"></div>
                            <div>
                                <h1>You are in a game of Love Letter</h1>
                                <div id="userList"><h2 id="users">Players In Game:</h2> {playerList}</div>
                                {(backendData.game?.players[yourIndex]?.currCard) ? (
                                <h3 id="aliveTeller">You are alive. You may still play this round.</h3>
                                ):(
                                <h3 id="aliveTeller">You are dead💀. You may no longer play this round.</h3>
                                )}
                            </div>
                            {(backendData.game.players[yourIndex]?.drawnCard) ? (
                                <h3 id="turnteller">It is your turn, your cards:</h3>
                            ) : (
                                <h3 id="turnteller">It is not your turn. Your card in hand:</h3>
                            )}
                            {(backendData.game.players[yourIndex].drawnCard) ? (<>
                                {(backendData.game.players[yourIndex].currCard === "Countess" 
                                && (backendData.game.players[yourIndex].drawnCard === "Prince" 
                                || backendData.game.players[yourIndex].drawnCard === "King")) ? (
                                    <div>
                                        <h3>You must play the Countess</h3>
                                        <button type="button" onClick={() => playCurrCard()}>{currCard}</button>
                                        {drawnCard}
                                    </div>
                                ) : (
                                    <>
                                    {(backendData.game.players[yourIndex].drawnCard === "Countess" 
                                && (backendData.game.players[yourIndex].currCard === "Prince" 
                                || backendData.game.players[yourIndex].currCard === "King")) ? (
                                        <div>
                                            <h3>You must play the Countess</h3>
                                            {currCard}
                                            <button type="button" onClick={() => playDrawnCard()}>{drawnCard}</button>
                                        </div>
                                    ): (                               
                                    <div>
                                        <button type="button" className='cardButton' onClick={() => playCurrCard()}>{currCard}</button>
                                        <button type="button" className='cardButton' onClick={() => playDrawnCard()}>{drawnCard}</button>
                                    </div>
                                    )}
                                    </>
                                )}
                             </>
                            ) : (
                                <div>{currCard}</div>
                            )}
                            <br/>
                            <h5 id="cardsInDeck">Cards remaining in the deck: {backendData.game.deckOfCards.length}</h5>
                            {(cards.includes(backendData.game.players[yourIndex].target)) ? (
                                <div id="target-box">
                                    <label htmlFor="msg" id="target-text">Choose a player to target: </label>
                                    <br/>
                                    {playerButton}
                                </div>
                            ) : (
                                <>
                                {(backendData.game.players[yourIndex].target) ? (
                                    <div id="numGuesser">
                                        <label htmlFor="msg" id="numGuessText">Choose a card to guess: </label> <br />
                                        <button className="guessCardsButton" onClick={() => guessCard("Priest")}><img src={Priest} alt="Priest" className="guessCards" /></button>
                                        <button className="guessCardsButton" onClick={() => guessCard("Baron")}><img src={Baron} alt="Baron" className="guessCards" /></button>
                                        <button className="guessCardsButton" onClick={() => guessCard("Handmaid")}><img src={Handmaid} alt="Handmaid" className="guessCards" /></button>
                                        <button className="guessCardsButton" onClick={() => guessCard("Prince")}><img src={Prince} alt="Prince" className="guessCards" /></button>
                                        <button className="guessCardsButton" onClick={() => guessCard("King")}><img src={King} alt="King" className="guessCards" /></button>
                                        <button className="guessCardsButton" onClick={() => guessCard("Countess")}><img src={Countess} alt="Countess" className="guessCards" /></button>
                                        <button className="guessCardsButton" onClick={() => guessCard("Princess")}><img src={Princess} alt="Princess" className="guessCards" /></button>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </>
                            )}
                            
                            <button type="button" name="seeAllCards" id="seeAllCards" className="btn btn-primary btn-lg text-white" 
                                onClick={() => toggleGuide()}>Click to see all cards</button>
                            {(guide) ? (
                                <div id="guide">
                                    <br />
                                    <h3>Number of Cards:</h3>
                                    <p>5 x Guards | 2 x Priests, Barons, Handmaids, Princes | 1 x King, Countess, Princess | 16 cards total</p>
                                    <h3>Cards (click to zoom in):</h3>
                                    <div id="help">{renderCardButtons()}</div>
                                    {renderZoomedCard()}
                                </div>
                            ) : (
                                <></>
                            )}
                            <div className="chat-container">
                                <header className="chat-header">
                                    <h3 className="chat-title">Play History</h3>
                                </header>
                                <div className="chat-message">{messages}<div ref={bottomRef} /></div>
                                <input type="text" className="text-black" id="msg" placeholder="Enter Message" ref={msgRef} onChange={e => setMessage(e.target.value)}/>
                                <button onClick={() => handleMessageSend()}>Send</button>
                            </div>
                            <button className="btn btn-primary btn-lg text-white" onClick={() => giveUp()}>Give Up</button>
                        </div>
                    )}
                </div>
                
            )}
        </div>
    );
}

export default Game;