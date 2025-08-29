import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Remove React.StrictMode to prevent double posting in development
// StrictMode intentionally double-renders components and effects
root.render(<App />);

// If you had this before (which causes double posting):
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );