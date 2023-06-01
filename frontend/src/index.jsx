import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import "./components/css/custom.css";
import "./components/css/styles.css";
import "./components/css/chatStyle.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
