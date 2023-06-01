import React from 'react';

const Home = () => {
    return (
        <div className="homecontainer">
            <h1 className="text-center fw-bold" >Love Letter Emulator</h1>
            <h3 className="text-center" >Play the Love Letter card game with friends around the world! </h3>
            <h3>To create or join a game, please first log in.</h3>
            <br/>
            <div className="text-center">
            <form action="/login">
                <input className="btn btn-primary btn-lg text-white" type="submit" name="login" value="Login" />
            </form>
            </div>
        </div>
    );
};

export default Home;