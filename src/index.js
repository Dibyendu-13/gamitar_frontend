import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated import
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')); // Create a root
root.render(<App />); // Use root.render instead of ReactDOM.render
