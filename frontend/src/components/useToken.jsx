import { useState } from 'react';

function useToken() {
  const getToken = () => {
    const tokenString = localStorage.getItem('token');
    const userToken = JSON.parse(tokenString);
    return userToken;
  };

  const [token, setToken] = useState(getToken());

  const saveToken = userToken => {
    if(userToken?.token === "undefined") {
      localStorage.removeItem('token');
    } else {
      localStorage.setItem('token', JSON.stringify(userToken));
      setToken(userToken);
    }
  };

  return {
    setToken: saveToken,
    token
  };
}

export default useToken;