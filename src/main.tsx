import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './lib/i18n';

// Permanently enforce light mode
document.documentElement.classList.remove('dark');
try {
  localStorage.setItem('reviewqr_theme', 'light');
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
