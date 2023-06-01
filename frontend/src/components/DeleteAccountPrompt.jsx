import React from 'react';

const DeleteAccountPrompt = ({handleSubmit, toggleScreen}) => {
    return (
        <div className="zoomedCardOverlay">
            <div className="deleteAccountContainer">
                <h2>Are you sure you want to delete your account? (This action cannot be undone)</h2>
                <button className="btn btn-secondary btn-lg text-white" onClick={handleSubmit}>Yes</button>
                <button className="btn btn-primary btn-lg text-white" onClick={toggleScreen}>No</button>
            </div>
        </div>
    );
};

export default DeleteAccountPrompt;