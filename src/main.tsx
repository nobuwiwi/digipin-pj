import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import TermsScreen from './screens/legal/TermsScreen.tsx';
import PrivacyScreen from './screens/legal/PrivacyScreen.tsx';
import ContactScreen from './screens/legal/ContactScreen.tsx';
import LegalInfoScreen from './screens/legal/LegalInfoScreen.tsx';
import { LineBrowserBanner } from './components/LineBrowserBanner.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

const path = window.location.pathname;

function renderPage() {
  switch (path) {
    case '/terms':
      return <TermsScreen />;
    case '/privacy':
      return <PrivacyScreen />;
    case '/contact':
      return <ContactScreen />;
    case '/legal':
      return <LegalInfoScreen />;
    default:
      return <App />;
  }
}

root.render(
  <StrictMode>
    <LineBrowserBanner />
    {renderPage()}
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
