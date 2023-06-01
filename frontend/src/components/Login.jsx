import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';

async function loginUser(data) {
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    return await fetch('/logins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    }).then(data => data.json());
}

const Login = ({ setToken }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState();
    const [pass, setPass] = useState();
    const [submit, setSubmit] = useState();
    const cards = ["Guard", "Priest", "Baron", "Handmaid", "Prince", "King", "Countess", "Princess"];
    const handleSubmit = async e => {
        e.preventDefault();
        if(cards.includes(user)) {
            alert(`Try not naming yourself one of these names: ${cards}`);
        } else {
            const data = await loginUser({user, pass, submit});
            if(data.token) {
                setToken(data.token);
                return(navigate("/profile"));
            } else {
                setBackendData(data);
            }
        } 
    }
    const [backendData, setBackendData] = useState([{}]);

    return (
        <div className="text-center homecontainer">
            <h1>Login/Register</h1>
            {(backendData.alert === undefined) ? (
                    <></>
                ) : (
            <p id="warning">{backendData.alert}</p>
            )}
            <form onSubmit={handleSubmit}>
                <h3>Username:</h3>
                <input className="input-lg" type="text" onChange={e => setUser(e.target.value)} required/>
                <br/>
                <h3>Password:</h3>
                <input className="input-lg" type="password" onChange={e => setPass(e.target.value)} required/>
                <br/>
                <br/> 
                <input className="btn btn-primary btn-lg text-white" type="submit" name="submit" value="Register" onClick={e => setSubmit("Register")} required/>
                
                <input className="btn btn-primary btn-lg text-white" type="submit" name="submit" value="Login" onClick={e => setSubmit("Login")} required/>
            </form>
        </div>
    );
};

Login.propTypes = {
    setToken: PropTypes.func.isRequired
}

export default Login;