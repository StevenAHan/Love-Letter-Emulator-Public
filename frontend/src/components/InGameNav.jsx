import React from 'react';
import useToken from "./useToken.jsx";

const InGameNav = () => {
    const { token } = useToken();
    
    return (
        <nav className="navbar navbar-expand bg-primary navbar-dark">
            <div className="container-fluid">
            <a className="navbar-brand" href="/">Home</a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav">
                <li className="nav-item">
                    <a className="nav-link" href="/lobby">Rejoin Game</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="/help">How to Play</a>
                </li>
                </ul>
                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                <form action="/profilesearch" method="GET" className="profilesearchform">
                    <input type="text" name="profile" placeholder='Search for Profile'/>
                    <input type="submit" value="search"/>
                </form>
                <a className="nav-link text-white" href="/profile">Hello, {token.user}</a>
                </div>
                </div>
            </div>
        </nav>
    );
};

export default InGameNav;