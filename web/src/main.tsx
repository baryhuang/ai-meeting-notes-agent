import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InsforgeProvider } from '@insforge/react';
import { insforge, setElectronSettings, initInsforge } from './insforge';
import './theme.css';
import App from './App';

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      settings: {
        loadSettings: () => Promise<Record<string, string>>;
        saveSettings: (s: Record<string, string>) => Promise<{ ok: boolean }>;
      };
      openExternal: (url: string) => Promise<void>;
    };
  }
}

async function bootstrap() {
  // In Electron, mark body and load persisted settings before creating the client
  if (window.electronAPI) {
    document.body.classList.add('electron');
    try {
      const settings = await window.electronAPI.settings.loadSettings();
      setElectronSettings(settings);
      initInsforge();
    } catch {
      // Fall back to env defaults
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <InsforgeProvider client={insforge as any}>
        <App />
      </InsforgeProvider>
    </StrictMode>,
  );
}

bootstrap();
