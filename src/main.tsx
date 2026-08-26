import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/ui/design/global.css';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { useScreenStore, currentScreen } from '@/state/screenStore';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing from index.html');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary debugContext={() => ({ screen: currentScreen(useScreenStore.getState()) })}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
