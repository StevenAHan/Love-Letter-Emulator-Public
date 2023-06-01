import React, { useEffect, useState } from 'react';
import { Navigate } from "react-router-dom";
import useToken from "./useToken.jsx";
import ErrorLoading from "./ErrorLoading.jsx";
import DeleteAccountPrompt from './DeleteAccountPrompt.jsx';

async function sendSubmit(data) {
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    return await fetch('/profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    }).then(data => data.json());
}


const Profile = () => {
    const { token, setToken } = useToken();
    const [backendData, setBackendData] = useState([{}]);
    const [submit, setSubmit] = useState();
    const [showDelete, setShowDelete] = useState(false);
    const handleSubmit = async e => {
        e.preventDefault();
        const data = await sendSubmit({submit});
        if(data && (submit === "Logout" || submit === "DeleteAccount")) {
            if(submit === "DeleteAccount") {
                alert("Account Deleted");
            }
            setToken(data);
            window.location.reload(false);
        }
    }


    const toggleScreen = async e => {
        e.preventDefault();
        setShowDelete(prev => !prev);
    }

    useEffect(() => {
        fetch("/profiles").then(response => response.json()).then(data => {
            setBackendData(data);
        });
    }, []);
    return (
        <div>
            
            {showDelete && <DeleteAccountPrompt handleSubmit={handleSubmit} toggleScreen={toggleScreen} />}
            {(!token) ? (
                <Navigate to="/login"/>
            )  : (
                <></>
            )}
            {(backendData.user?.username === undefined) ? (
                    <ErrorLoading/>
                ) : (
                <div className='homecontainer'>
                    <h1>Hello, {backendData.user?.username}</h1>
                    <br/>
                    <h2>Your Stats:</h2>
                    <h4>Wins: {backendData.user?.wins}</h4>
                    <h4>Losses: {backendData.user?.losses}</h4>
                    <h4>Winstreak: {backendData.user?.winstreak}</h4>
                    <form onSubmit={handleSubmit}>
                        <input className="btn btn-primary btn-lg text-white" type="submit" name="Logout" value="Logout" onClick={e => setSubmit("Logout")}/>
                    </form>

                    <form onSubmit={toggleScreen} className="deleteAcc">
                        <input className="btn btn-secondary btn-lg text-white" type="submit" name="Delete Account" value="Delete Account" onClick={e => setSubmit("DeleteAccount")}/>
                    </form>
                </div>
                )}
        </div>
    );
};

export default Profile;