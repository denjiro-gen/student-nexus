const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    backgroundColor: '#f5f7f5'
  });

  // Load the React app
  // In development, load from localhost:3000
  // In production, load from build folder
  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (isDev) {
    // mainWindow.webContents.openDevTools();
  }

  // Open links with target="_blank" in the default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set Content Security Policy to silence the Electron CSP warning
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: ws: wss:"]
      }
    });
  });

  createWindow();

  // Handle push notifications from renderer (Node.js has no CORS restrictions)
  ipcMain.handle('send-push-notification', async (event, { token, title, body, data }) => {
    try {
      const https = require('https');
      const payload = JSON.stringify({ to: token, sound: 'default', title, body, data: data || {} });
      return await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'exp.host',
          path: '/--/api/v2/push/send',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Length': Buffer.byteLength(payload),
          },
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { resolve({ status: 'sent' }); }
          });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    } catch (err) {
      console.error('[IPC Push Error]', err);
      return { error: err.message };
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
