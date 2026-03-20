const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { loadSettings, saveSettings } = require('./storage');

let mainWindow = null;
let localServer = null;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function findDistDir() {
  const candidates = [
    path.join(process.resourcesPath || '', 'web', 'dist'),
    path.join(__dirname, '..', 'web', 'dist'),
  ];
  return candidates.find((d) => {
    try { fs.accessSync(path.join(d, 'index.html')); return true; } catch { return false; }
  }) || candidates[0];
}

function startLocalServer(distDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (urlPath === '/') urlPath = '/index.html';

      let filePath = path.join(distDir, urlPath);

      // SPA fallback: if file doesn't exist and it's not an asset, serve index.html
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // Listen on a random available port
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Local server running at http://127.0.0.1:${port}`);
      resolve({ server, port });
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Serve built files via local HTTP server so OAuth redirects work
    const distDir = findDistDir();
    const { server, port } = await startLocalServer(distDir);
    localServer = server;
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  }

  // Handle OAuth popups: open auth URLs in a child window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.includes('accounts.google.com') ||
      url.includes('github.com/login') ||
      url.includes('insforge')
    ) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          parent: mainWindow,
          modal: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }
    // Other external links open in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('settings:load', () => loadSettings());
ipcMain.handle('settings:save', (_event, settings) => {
  saveSettings(settings);
  return { ok: true };
});
ipcMain.handle('open-external', (_event, url) => shell.openExternal(url));

// macOS menu
const template = [
  {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
      { type: 'separator' },
      { role: 'window' },
    ],
  },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
});
