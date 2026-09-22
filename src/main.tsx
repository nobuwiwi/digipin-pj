import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import TermsScreen from './screens/legal/TermsScreen.tsx';
import PrivacyScreen from './screens/legal/PrivacyScreen.tsx';
import ContactScreen from './screens/legal/ContactScreen.tsx';
import LegalInfoScreen from './screens/legal/LegalInfoScreen.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

const path = window.location.pathname;

if (path === '/terms') {
  root.render(<StrictMode><TermsScreen /></StrictMode>);
} else if (path === '/privacy') {
  root.render(<StrictMode><PrivacyScreen /></StrictMode>);
} else if (path === '/contact') {
  root.render(<StrictMode><ContactScreen /></StrictMode>);
} else if (path === '/legal') {
  root.render(<StrictMode><LegalInfoScreen /></StrictMode>);
} else {
  root.render(<StrictMode><App /></StrictMode>);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
