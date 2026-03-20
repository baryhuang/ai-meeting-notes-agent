const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = 'settings.json';

const DEFAULTS = {
  backendUrl: 'https://gx2m4dge.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDE5MTR9.4hhZ-ohU5Wb5WnA3tvNjsh_KDs_R-tQAKb5OQ7fjX3A',
  workspaceUrl: 'https://workspace.openagents.org/0048fff6?token=vMkZ8IC1_U1e_8MwR9s4MBbOJebOPauMytwlA9tKKUk',
  agentName: 'os-agent',
};

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function loadSettings() {
  const filePath = getSettingsPath();
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return { ...DEFAULTS, ...data };
    }
  } catch {
    // Corrupted file — fall back to defaults
  }
  return { ...DEFAULTS };
}

function saveSettings(settings) {
  const filePath = getSettingsPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
}

module.exports = { loadSettings, saveSettings, DEFAULTS };
