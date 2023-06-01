import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";


const OtherProfs = () => {
    const [backendData, setBackendData] = useState([{}]);
    const [searchParams] = useSearchParams();
    useEffect(() => {
        console.log(`/otherprofs/${searchParams.get('profile')}`)
        fetch(`/otherprofs/${searchParams.get('profile')}`).then(response => response.json()).then(data => {
            setBackendData(data);
        });
    }, [searchParams]);
    return (
        <div className='homecontainer'>
            {(backendData.user?.username === undefined) ? (
                <>
                    <h2>Profile does not exist!</h2>
                </>
                ) : (
                <div>
                    <h1>{backendData.user?.username}'s Profile</h1>
                    <br/>
                    <h2>Stats:</h2>
                    <h4>Wins: {backendData.user?.wins}</h4>
                    <h4>Losses: {backendData.user?.losses}</h4>
                    <h4>Winstreak: {backendData.user?.winstreak}</h4>
                </div>
                )}
        </div>
    );
};

export default OtherProfs;