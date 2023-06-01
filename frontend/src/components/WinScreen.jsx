import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useToken from "./useToken.jsx";

const WinScreen = ({ socket }) => {
  const [searchParams] = useSearchParams();
  const [backendData, setBackendData] = useState([{}]);
  const [messages, setMessages] = useState([]);
  const { token } = useToken();

  const rematch = (e) => {
    e.preventDefault();
    console.log(searchParams)
    console.log(`/rematch?user=${token.user}&roomcode=${searchParams.get("roomcode")}`)
    fetch(`/rematch?user=${token.user}&roomcode=${searchParams.get("roomcode")}`).then((resp => resp.json()))
    .then((data) => {
      if(data.result === "roomMade" || data.result === "roomTaken") {
        window.location.href = `/lobby?roomno=${searchParams.get("roomcode")}`;
      }
    });
  }

  useEffect(() => {
    if(!backendData.game) {
      fetch(`/wins${window.location.search}`)
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data);
      });
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
  

    if (socket && backendData.gameExists) {
      showMessages(backendData.game.playHistory);
      socket.emit("deleteLobby", searchParams.get("roomcode"));
    }
  }, [socket, backendData, searchParams, token]);

  return (
    <div>
      {(socket && backendData) ? (
        <>
          <h1>There is a winner! </h1>
          <br />
          <h5>
            The winning player(s) is: {searchParams.get("winner")}, and they won
            because:{" "}
          </h5>
          <h2>{searchParams.get("reason")}</h2>

          <div className="won-chat-container">
              <header className="chat-header">
                  <h3 className="chat-title">Play History</h3>
              </header>
              <div className="chat-message">{messages}</div>
          </div>

          <form onSubmit={rematch}>
            <input className="btn btn-primary btn-lg text-white" type="submit" name="Rematch" value="Rematch"/>
          </form>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default WinScreen;