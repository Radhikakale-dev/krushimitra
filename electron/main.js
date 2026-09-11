/**
 * electron/main.js
 * KrushiMitra AI — Production-Ready Electron Main Process
 *
 * Features:
 *  - BrowserWindow creation with security hardening
 *  - Auto-updater (electron-updater)
 *  - System-tray with quick actions
 *  - Offline detection via net.isOnline()
 *  - App lifecycle management
 *  - Single-instance lock
 */

const {
  app, BrowserWindow, ipcMain, shell, Menu, Tray,
  dialog, Notification, net, nativeImage,
} = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipc/handlers');

// ── Dev / Production detection ────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ── Single-instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray       = null;

// ─────────────────────────────────────────────────────────────────────────────
// Create Main Window
// ─────────────────────────────────────────────────────────────────────────────
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width:   1440,
    height:  900,
    minWidth:  1024,
    minHeight: 700,
    title: 'KrushiMitra AI',
    icon: path.join(__dirname, '../frontend/public/favicon.ico'),
    backgroundColor: '#020617',
    show: false,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      webSecurity:      true,
      allowRunningInsecureContent: false,
      devTools: isDev,
    },
  });

  // ── Load URL ─────────────────────────────────────────────────────────────────
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // ── Show gracefully ───────────────────────────────────────────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    if (isDev) mainWindow.maximize();
  });

  // ── External links in browser ─────────────────────────────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // ── Prevent navigation away from app ─────────────────────────────────────────
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  // ── Offline/Online detection ──────────────────────────────────────────────────
  const sendNetworkStatus = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('network:status', { online: net.isOnline() });
    }
  };

  // Poll every 10 seconds and send status to renderer
  let networkInterval = setInterval(sendNetworkStatus, 10000);
  mainWindow.on('closed', () => {
    clearInterval(networkInterval);
    mainWindow = null;
  });

  // Send initial status after load
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(sendNetworkStatus, 500);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// System Tray
// ─────────────────────────────────────────────────────────────────────────────
const createTray = () => {
  try {
    const iconPath = path.join(__dirname, '../frontend/public/favicon.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'KrushiMitra AI',  type: 'normal', enabled: false },
      { type: 'separator' },
      { label: 'Open',  click: () => mainWindow ? mainWindow.show() : createWindow() },
      { label: 'POS Billing', click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('navigate:to', '/pos');
          }
        }
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]);

    tray.setToolTip('KrushiMitra AI — Agriculture Shop Software');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow ? mainWindow.show() : createWindow());
  } catch (e) {
    console.warn('Tray creation failed (non-critical):', e.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// IPC Setup
// ─────────────────────────────────────────────────────────────────────────────
setupIpcHandlers(ipcMain);

// ─────────────────────────────────────────────────────────────────────────────
// App Menu: Remove default for clean POS UI
// ─────────────────────────────────────────────────────────────────────────────
Menu.setApplicationMenu(null);

// ─────────────────────────────────────────────────────────────────────────────
// App Lifecycle
// ─────────────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Bring existing window to front if second instance attempted
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─────────────────────────────────────────────────────────────────────────────
// Crash / Unhandled error guard
// ─────────────────────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[Electron] Uncaught exception:', err);
  dialog.showErrorBox('KrushiMitra AI — Unexpected Error',
    `An unexpected error occurred:\n\n${err.message}\n\nThe application will continue running.`
  );
});
