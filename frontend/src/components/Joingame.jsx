import React, { useEffect, useState } from 'react';
import { Navigate } from "react-router-dom";
import useToken from "./useToken.jsx";
import ErrorLoading from "./ErrorLoading.jsx";


async function attemptJoin(data) {
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    return await fetch('/joingames', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    }).then(data => data.json());
}


const Joingame = () => {
    const { token, } = useToken();
    const [backendData, setBackendData] = useState([{}]);
    const [roomcode, setRoomcode] = useState();
    const handleSubmit = async e => {
        e.preventDefault();
        const data = await attemptJoin({roomcode});
        if(!data.alert) {
            return(window.location.href = `/lobby?roomno=${roomcode}`);
        } else {
            setBackendData(data);
        }
    }

    
    useEffect(() => {
        fetch("/joingames").then(response => response.json()).then(data => {
            setBackendData(data);
        });
    }, []);
    return (   
        <div>
            {(!token) ? (
                <Navigate to="/login"/>
            )  : (
                <></>
            )}
            {(!backendData) ? (
                <ErrorLoading/>
            ) : (
                <div class="text-center homecontainer">
                <h1>Join a Lobby</h1>

                <p id="warning">{backendData.alert}</p>

                <form onSubmit={handleSubmit}>
                    <h3>Join Code:</h3>
                    <input className="input-lg plain" type="text" name="roomcode" onChange={e => setRoomcode(e.target.value)}/>
                    <br/>
                    <br/>
                    <input className="btn btn-primary btn-lg text-white" type="submit" name="submit" value="Join"/>
                </form>
                </div>
            )}
        </div>
    );
};

export default Joingame;