/**
 * ADW Finance - Entry Point
 * SaaS multi-tenant finance tracking application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppRouter } from './src/Router';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Check if we should use auth (production) or direct access (development)
const USE_AUTH = import.meta.env.VITE_USE_AUTH !== 'false';

root.render(
  <React.StrictMode>
    {USE_AUTH ? (
      <AppRouter MainApp={App} />
    ) : (
      // Direct access mode for development without auth
      <App />
    )}
  </React.StrictMode>
);
