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
      contextIsolation: true
    }
  });

  // Clean professional look without standard browser menu bar
  Menu.setApplicationMenu(null);

  const devUrl = 'http://localhost:5173';
  const prodPath = path.join(__dirname, '../dist/index.html');

  // If local dev server is active, load it; otherwise load dist/index.html
  mainWindow.loadURL(devUrl).catch(() => {
    mainWindow.loadFile(prodPath);
  });

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
