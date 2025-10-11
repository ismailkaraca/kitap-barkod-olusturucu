import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Mount the React application onto the #root element in index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
