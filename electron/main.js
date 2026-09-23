const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: 'Blinkit Dark Store Deep Cleaning Tracker',
    backgroundColor: '#0c831f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Hide default menu for a clean, professional app UI
  Menu.setApplicationMenu(null);

  // Check if Vite dev server is running or load production build
  const devUrl = 'http://localhost:5173';
  const prodPath = path.join(__dirname, '../dist/index.html');

  // Attempt to load dev server first, fall back to dist/index.html
  mainWindow.loadURL(devUrl).catch(() => {
    mainWindow.loadFile(prodPath);
  });

  // Handle window close
  mainWindow.on('closed', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
