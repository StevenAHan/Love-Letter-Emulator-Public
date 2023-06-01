import React from 'react';

const LoggedHome = () => {
    return (
        <div className="homecontainer">
            <h1 className="text-center fw-bold" >Love Letter Emulator</h1>
            <h3 className="text-center" >Play the Love Letter card game with friends around the world! </h3>
            <br/>
            <div className="text-center">
            <form action="/lobby">
                <input className="btn btn-primary btn-lg text-white" type="submit" name="create game" value="Create New Game" />
            </form>
            <br/>
            <form action="/joingame">
                <input className="btn btn-primary btn-lg text-white" type="submit" name="join game" value="Join Game"/>
            </form>
            </div>
        </div>
    );
};

export default LoggedHome;