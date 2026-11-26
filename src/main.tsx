import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Case A Tier 1: Global Google Maps Platform quota / auth failure listeners
if (typeof window !== 'undefined') {
  const triggerQuotaExceeded = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    triggerQuotaExceeded();
  };

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const joined = args.map((item) => String(item ?? '')).join(' ');
    if (
      joined.includes('OverQuotaMapError') ||
      joined.includes('QuotaExceededError') ||
      joined.includes('OVER_QUERY_LIMIT')
    ) {
      triggerQuotaExceeded();
    }
    originalConsoleError(...args);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
