/**
 * electron/ipc/handlers.js
 * KrushiMitra AI — IPC Channel Handlers
 *
 * Channels:
 *  app:getVersion          → string
 *  app:getDataPath         → string
 *  window:minimize/maximize/close → void
 *  print:invoice           → { success, error? }
 *  print:thermal           → { success, error? }      ← NEW thermal ESC/POS
 *  pdf:save                → { success, filePath? }
 *  file:selectLogo         → base64 string | null
 *  notification:show       → void
 *  printer:list            → string[]                 ← NEW list printers
 *  printer:getSettings     → object                   ← NEW saved settings
 *  printer:saveSettings    → { success }              ← NEW save settings
 */

const { app, BrowserWindow, dialog, Notification, webContents } = require('electron');
const path = require('path');
const fs   = require('fs');

// ── Printer settings storage (userData/printerSettings.json) ──────────────────
const getSettingsPath = () => path.join(app.getPath('userData'), 'printerSettings.json');

const loadPrinterSettings = () => {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return {
    printerName:  '',         // '' = default system printer
    paperWidth:   '80mm',     // '58mm' | '80mm'
    autoPrint:    false,
    copies:       1,
    silent:       false,      // true = no dialog
    margins: { top: 2, bottom: 2, left: 3, right: 3 }, // mm
  };
};

const savePrinterSettings = (settings) => {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf8');
};

// ──────────────────────────────────────────────────────────────────────────────
const setupIpcHandlers = (ipcMain) => {

  // ── App Info ─────────────────────────────────────────────────────────────────
  ipcMain.handle('app:getVersion',  () => app.getVersion());
  ipcMain.handle('app:getDataPath', () => app.getPath('userData'));

  // ── Window Controls ──────────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });

  ipcMain.on('window:close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });

  // ── List installed printers ──────────────────────────────────────────────────
  ipcMain.handle('printer:list', async () => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return [];
      const printers = await win.webContents.getPrintersAsync();
      return printers.map(p => ({
        name:        p.name,
        displayName: p.displayName || p.name,
        isDefault:   p.isDefault,
        status:      p.status,
      }));
    } catch (err) {
      console.error('printer:list error:', err.message);
      return [];
    }
  });

  // ── Get printer settings ─────────────────────────────────────────────────────
  ipcMain.handle('printer:getSettings', () => loadPrinterSettings());

  // ── Save printer settings ────────────────────────────────────────────────────
  ipcMain.handle('printer:saveSettings', (event, settings) => {
    try {
      savePrinterSettings(settings);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Standard Invoice Print (A4 / browser print dialog) ──────────────────────
  ipcMain.handle('print:invoice', async (event, options = {}) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) throw new Error('No focused window');

      const settings = loadPrinterSettings();

      const printOptions = {
        silent:          options.silent ?? settings.silent,
        printBackground: true,
        copies:          options.copies || settings.copies || 1,
        margins: {
          marginType: 'custom',
          top:    0.1,
          bottom: 0.1,
          left:   0.1,
          right:  0.1,
        },
      };

      // If a specific printer is requested or saved
      const printerName = options.printerName || settings.printerName;
      if (printerName) printOptions.deviceName = printerName;

      return new Promise((resolve) => {
        win.webContents.print(printOptions, (success, failureReason) => {
          if (success) resolve({ success: true });
          else resolve({ success: false, error: failureReason });
        });
      });
    } catch (error) {
      console.error('IPC print:invoice error:', error.message);
      return { success: false, error: error.message };
    }
  });

  // ── Thermal Printer Print ────────────────────────────────────────────────────
  // Opens a hidden print window sized to the thermal paper width,
  // injects the receipt HTML, then silently prints.
  ipcMain.handle('print:thermal', async (event, { html, printerName, paperWidth = '80mm', copies = 1, silent = true }) => {
    let thermalWin = null;

    try {
      // Paper width in pixels at 96 DPI (browser standard)
      // 58mm ≈ 220px | 80mm ≈ 302px
      const widthPx  = paperWidth === '58mm' ? 220 : 302;
      const heightPx = 1200; // tall enough for most receipts

      thermalWin = new BrowserWindow({
        width:  widthPx + 40,
        height: heightPx,
        show:   false,
        webPreferences: {
          nodeIntegration:    false,
          contextIsolation:   true,
          webSecurity:        false,  // allow loading inline base64 images
        },
      });

      // Build a complete HTML document with thermal CSS reset
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${widthPx}px; background:#fff; font-family:'Courier New',monospace; }
  @page { size: ${widthPx}px auto; margin: 2mm; }
  @media print { html, body { width:${widthPx}px; } }
</style>
</head>
<body>${html}</body>
</html>`;

      await thermalWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

      // Wait for content to fully render
      await new Promise(r => setTimeout(r, 600));

      const settings = loadPrinterSettings();
      const resolvedPrinter = printerName || settings.printerName || '';

      const printOptions = {
        silent:          silent,
        printBackground: true,
        copies:          copies,
        margins: {
          marginType: 'custom',
          top:    0.02,
          bottom: 0.02,
          left:   0.02,
          right:  0.02,
        },
        pageSize: {
          width:  widthPx * 1000,    // Electron uses microns × 1000
          height: heightPx * 1000,
        },
      };

      if (resolvedPrinter) printOptions.deviceName = resolvedPrinter;

      return new Promise((resolve) => {
        thermalWin.webContents.print(printOptions, (success, failureReason) => {
          thermalWin.destroy();
          thermalWin = null;
          if (success) resolve({ success: true });
          else resolve({ success: false, error: failureReason || 'Print failed' });
        });
      });
    } catch (error) {
      if (thermalWin && !thermalWin.isDestroyed()) thermalWin.destroy();
      console.error('IPC print:thermal error:', error.message);
      return { success: false, error: error.message };
    }
  });

  // ── Generate PDF from current page ──────────────────────────────────────────
  ipcMain.handle('pdf:generate', async (event, options = {}) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) throw new Error('No focused window');

      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize:        options.pageSize || 'A4',
        landscape:       options.landscape || false,
        margins: {
          marginType: 'custom',
          top:    0.1,
          bottom: 0.1,
          left:   0.1,
          right:  0.1,
        },
      });

      return { success: true, data: pdfBuffer.toString('base64') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ── Save PDF ──────────────────────────────────────────────────────────────────
  ipcMain.handle('pdf:save', async (event, pdfDataUrl, suggestedName) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        title:       'Save Invoice as PDF',
        defaultPath: path.join(app.getPath('documents'), suggestedName || 'invoice.pdf'),
        filters:     [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) return { success: false, reason: 'cancelled' };

      // Accept both data URL and raw base64
      const base64Data = pdfDataUrl.includes(',')
        ? pdfDataUrl.split(',')[1]
        : pdfDataUrl;
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      return { success: true, filePath };
    } catch (error) {
      console.error('IPC pdf:save error:', error.message);
      return { success: false, error: error.message };
    }
  });

  // ── Select Logo File ──────────────────────────────────────────────────────────
  ipcMain.handle('file:selectLogo', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title:   'Select Shop Logo',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
      properties: ['openFile'],
    });

    if (canceled || !filePaths.length) return null;

    const imageBuffer = fs.readFileSync(filePaths[0]);
    const ext = path.extname(filePaths[0]).slice(1);
    return `data:image/${ext};base64,${imageBuffer.toString('base64')}`;
  });

  // ── Desktop Notifications ─────────────────────────────────────────────────────
  ipcMain.on('notification:show', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body, icon: path.join(__dirname, '../../frontend/public/favicon.ico') }).show();
    }
  });

  // ── Update Checks ─────────────────────────────────────────────────────────────
  ipcMain.handle('update:check', () => ({ available: false, version: app.getVersion() }));
};

module.exports = { setupIpcHandlers };
