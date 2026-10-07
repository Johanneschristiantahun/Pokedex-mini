import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)

// Register PWA Service Worker for offline capability & asset caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || './'}sw.js`;
    navigator.serviceWorker.register(swUrl).then((registration) => {
      registration.update().catch(() => {});
      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (installing) {
          installing.onstatechange = () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          };
        }
      };
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

