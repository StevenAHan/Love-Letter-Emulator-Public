import React from 'react';

const ErrorLoading = () => {
    return(
        <div>
            <p>Loading page. If it doesn't load, try refreshing, or relogging in.</p>
            <form method="GET" action="/login">
                <input className="btn btn-primary btn-lg text-white" type="submit" name="submit" value="Register / Login"/>
            </form>
        </div>
    );
}

export default ErrorLoading;