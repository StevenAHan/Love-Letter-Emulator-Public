import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import useToken from "./useToken.jsx";
import ErrorLoading from "./ErrorLoading.jsx";

const Lobby = ({socket}) => {
    const { token, setToken } = useToken();
    const [backendData, setBackendData] = useState([]);
    const [players, setPlayers] = useState([]);
    const navigate = useNavigate();
    const [notRendered, setNotRendered] = useState(true);
    useEffect(() => {
        const getPlayers = (backendData) => {
            const playersComp = backendData.game?.players.map(player => {
                return <h5>{player.username}</h5>;
            });
            setPlayers(playersComp);
        }
        const updateRoom = () => {
            fetch(`/lobbys${window.location.search}`).then(response => response.json()).then(data => {
                setBackendData(data);
                getPlayers(data);
            });
        }
        if(!backendData.game || backendData.game.players.filter(player => player.username === token.user) === []) {
            updateRoom();
        }

        if(backendData.started && backendData.game) {
            window.location.href = `/game?roomno=${backendData.game.roomcode}&player=${token.user}`;           
        }
        if(socket){
            if(notRendered && backendData.game?.roomcode) {
                setToken({user: token.user, ingame: true});
                socket.emit("joinRoom"); 
                setNotRendered(false);
            }

            socket.on("gameStart", () => {
                window.location.href = `/game?roomno=${backendData.game.roomcode}&player=${token.user}`;
            });


            socket.on("roomUpdated", () =>{
                updateRoom();
            });
            
            socket.on("lobbyDeleted", (roomcode) => {
                if(roomcode === backendData.game?.roomcode){
                    alert("Lobby has been deleted");
                    window.location.href = '/';
                }
            });

            return () => {
                socket.off('gameStart');
                socket.off("roomUpdated");
                socket.off("lobbyDeleted");
              };
        }
    }, [socket, navigate, backendData, token, players, notRendered, setToken]);

    const handleStartGame = () => {
        if(backendData.game.players.length < 2){
            alert("You don't have enough players to start the game! (You need at least 2 players)");
        } else {
            socket.emit("startGame", {roomcode: backendData.game.roomcode, username: token.user});
        }
    }
    
    const handleDeleteLobby = () => {
        setToken({user: token.user, ingame: false});
        socket.emit("deleteLobby", backendData.game.roomcode);
    }

    const handleLeaveLobby = () => {
        window.location.href = '/';
        setToken({user: token.user, ingame: false});
        socket.emit("leaveLobby", {game: backendData.game.roomcode, name: token.user});
        alert("You left the lobby");
    }

    return (
        <div className='homecontainer'>
            {(!token) ? (
                <Navigate to="/login"/>
            )  : (
                <></>
            )}

            {(backendData.error) ? (
                <Navigate to="/login"/>
            ) : (
                <></>
            )}
            
            {(!backendData.game) ? (
                <ErrorLoading/>
            ) : (<>{(backendData.started) ? (
                    <></>
                ) : (
                    <div className="text-left">
                        <h1 id="room-name">Room Name: </h1> <h1 className="plain">{backendData.game.roomcode}</h1>
                        <h2 id="host">Host: {backendData.game.players[0].username}</h2>
                        <h2 id="users">Players:</h2> {players}
                        <br/>
                        <br/>
                        <button className="btn btn-primary btn-lg text-white" onClick={handleLeaveLobby}>Leave Lobby</button>
                        <br/>
                        {backendData.game.players[0].username === token.user &&
                            <div id="startGameForm">
                                <h3>Host Controls:</h3>
                                <button className="btn btn-primary btn-lg text-white" onClick={handleStartGame}>Start Game</button>
                                <button className="btn btn-primary btn-lg text-white" onClick={handleDeleteLobby}>Delete Lobby</button>
                            </div>
                        }
                    </div>
                )}</>
            )}                
        </div>
    );
};

export default Lobby;