/**
 * Electron Main Process for LPJ BOS Desktop
 * Configures secure offline local storage in %APPDATA%\LPJ BOS Desktop\
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Determine local application data directory
const userDataDir = path.join(app.getPath('userData'), 'LPJ BOS Desktop');
const paths = {
  root: userDataDir,
  data: path.join(userDataDir, 'data'),
  photos: path.join(userDataDir, 'files', 'photos'),
  pdf: path.join(userDataDir, 'files', 'pdf'),
  backups: path.join(userDataDir, 'backups'),
  logs: path.join(userDataDir, 'logs'),
  dbFile: path.join(userDataDir, 'data', 'lpj-bos.sqlite'),
};

// Ensure directories exist
function ensureDirectories() {
  Object.values(paths).forEach((dirPath) => {
    if (dirPath.endsWith('.sqlite')) return;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

function createWindow() {
  ensureDirectories();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'LPJ BOS Desktop - Aplikasi Pengelolaan & SPJ BOS Offline',
    backgroundColor: '#0D2345',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // In production load local dist/index.html, in dev load dev server
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('app:get-paths', async () => {
  return paths;
});

ipcMain.handle('app:save-photo', async (event, { fileName, base64Data }) => {
  try {
    ensureDirectories();
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const targetFile = path.join(paths.photos, fileName);
    fs.writeFileSync(targetFile, buffer);
    return { success: true, relativePath: path.relative(userDataDir, targetFile) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:save-pdf', async (event, { fileName, base64Data }) => {
  try {
    ensureDirectories();
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const targetFile = path.join(paths.pdf, fileName);
    fs.writeFileSync(targetFile, buffer);
    return { success: true, relativePath: path.relative(userDataDir, targetFile) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
