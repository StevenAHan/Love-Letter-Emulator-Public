import './App.css';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './components/Home.jsx';
import Game from './components/Game.jsx';
import PreloginNav from "./components/PreloginNav.jsx";
import Lobby from "./components/Lobby.jsx";
import Login from "./components/Login.jsx";
import Joingame from './components/Joingame.jsx';
import Profile from './components/Profile.jsx';
import PostloginNav from "./components/PostloginNav.jsx";
import useToken from "./components/useToken.jsx";
import LoggedHome from "./components/LoggedHome.jsx";
import io from 'socket.io-client';
import InGameNav from './components/InGameNav.jsx';
import InGameHome from './components/InGameHome.jsx';
import Help from "./components/Help.jsx";
import WinScreen from './components/WinScreen.jsx';
import OtherProfs from './components/OtherProfs.jsx';

async function checkLogin(data) {
  const formData = new URLSearchParams();
  Object.keys(data).forEach(key => formData.append(key, data[key]));
  return await fetch('/s', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  }).then(data => data.json());
}

const App = () => {
  const [socket, setSocket] = useState(null);
  const { token, setToken } = useToken();
  const tokenUser = token?.user;
  checkLogin({tokenUser}).then((data) => {
    if(JSON.stringify(data.token) !== JSON.stringify(token)) {
      setToken(data.token);
    }
  });

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);

  return (
    <div className="App">
      {(!token?.user) ? (
                <PreloginNav/>
            )  : (
              <>{(!(token?.ingame)) ? (
                <PostloginNav/>
              ): (
                <InGameNav/>
              )}</>
            )}
      <br/><br/>
      <BrowserRouter>
        <Routes>
        {(!token) ? (
                <Route path='/' exact element={<Home/>} />
            )  : (
              <>{(!(token?.ingame)) ? (
                <Route path='/' exact element={<LoggedHome/>} />
              ): (
                <Route path='/' exact element={<InGameHome/>} />
              )}</>
            )}
          <Route path='/game' exact element={<Game socket={socket}/>} />
          <Route path='/lobby' exact element={<Lobby socket={socket}/>} />
          <Route path='/login' exact element={<Login setToken={setToken}/>} />
          <Route path='/profilesearch' exact element={<OtherProfs/>} />
          <Route path='/profile' exact element={<Profile/>} />
          <Route path='/joingame' exact element={<Joingame/>} />
          <Route path='/help' exact element={<Help/>} />
          <Route path='/win' exact element={<WinScreen socket={socket}/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;