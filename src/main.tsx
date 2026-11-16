import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      if (
        typeof event.filename === 'string' &&
        (event.filename.startsWith('chrome-extension://') ||
          event.filename.startsWith('moz-extension://'))
      ) {
        event.preventDefault();
      }
    },
    true
  );
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({ immediate: true });
  } catch {
    // Service worker registration is best-effort
  }
}

createRoot(document.getElementById('root')!).render(<App />);
