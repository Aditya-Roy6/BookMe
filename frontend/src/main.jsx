import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import App from './App.jsx';
import './index.css';

// Automatically recover when user has a cached tab after a fresh deployment
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

window.addEventListener('unhandledrejection', (event) => {
  if (
    event?.reason?.message?.includes('Failed to fetch dynamically imported module') ||
    event?.reason?.message?.includes('MIME type of "text/html"')
  ) {
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroUIProvider>
      <main className="dark text-foreground bg-background min-h-screen">
        <App />
      </main>
    </HeroUIProvider>
  </React.StrictMode>,
);

