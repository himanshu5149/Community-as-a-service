import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket errors and HMR-related rejections that occur 
// because HMR is disabled in this environment.
if (import.meta.env.DEV) {
  const suppressErrors = (message: string) => {
    return message.includes('WebSocket') ||
           message.includes('HMR') ||
           message.includes('websocket');
  };

  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && suppressErrors(args[0])) return;
    originalConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message && suppressErrors(event.reason.message)) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
