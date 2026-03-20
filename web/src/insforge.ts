import { createClient } from '@insforge/sdk';

// Electron settings — populated before initInsforge() is called
let _electronSettings: {
  backendUrl?: string;
  anonKey?: string;
  workspaceUrl?: string;
  agentName?: string;
} | null = null;

export function setElectronSettings(s: typeof _electronSettings) {
  _electronSettings = s;
}

export function getElectronSettings() {
  return _electronSettings;
}

// The client. Created eagerly on import (browser) or after setElectronSettings (Electron).
// initInsforge() re-creates it if Electron settings were loaded.
export let insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
});

export function initInsforge() {
  const baseUrl =
    _electronSettings?.backendUrl || import.meta.env.VITE_INSFORGE_BASE_URL;
  const anonKey =
    _electronSettings?.anonKey || import.meta.env.VITE_INSFORGE_ANON_KEY;
  insforge = createClient({ baseUrl, anonKey });
}
