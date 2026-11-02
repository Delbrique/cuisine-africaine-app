// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mode PWA : fonctionne hors-ligne et se met à jour automatiquement.
serviceWorkerRegistration.register({
  onUpdate: (registration) => window.dispatchEvent(new CustomEvent('sw-update', { detail: registration })),
});
