/**
 * electron/preload.js
 * KrushiMitra AI — Secure Context Bridge
 *
 * Exposes safe, controlled APIs from the main process to the React renderer.
 * contextIsolation=true — renderer can ONLY access what is explicitly exposed here.
 *
 * Printer API additions:
 *  electronAPI.printer.list()             → [{ name, displayName, isDefault }]
 *  electronAPI.printer.getSettings()      → settings object
 *  electronAPI.printer.saveSettings(s)    → { success }
 *  electronAPI.printer.printThermal(opts) → { success, error? }
 *  electronAPI.printer.printInvoice(opts) → { success, error? }
 *  electronAPI.printer.generatePDF(opts)  → { success, data: base64 }
 *  electronAPI.pdf.save(dataUrl, name)    → { success, filePath? }
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // ── App Info ──────────────────────────────────────────────────────────────────
  getAppVersion:  () => ipcRenderer.invoke('app:getVersion'),
  getAppDataPath: () => ipcRenderer.invoke('app:getDataPath'),
  getPlatform:    () => process.platform,

  // ── Window Controls ───────────────────────────────────────────────────────────
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow:    () => ipcRenderer.send('window:close'),

  // ── Thermal / Invoice Printing ────────────────────────────────────────────────
  printer: {
    /**
     * Returns all installed printers on the system.
     * @returns {Promise<Array<{name,displayName,isDefault,status}>>}
     */
    list: () => ipcRenderer.invoke('printer:list'),

    /**
     * Returns saved printer settings from userData/printerSettings.json
     * @returns {Promise<{printerName,paperWidth,autoPrint,copies,silent,margins}>}
     */
    getSettings: () => ipcRenderer.invoke('printer:getSettings'),

    /**
     * Persists printer settings.
     * @param {object} settings
     * @returns {Promise<{success:boolean}>}
     */
    saveSettings: (settings) => ipcRenderer.invoke('printer:saveSettings', settings),

    /**
     * Opens a sized hidden window and silently prints thermal receipt HTML.
     * @param {{ html:string, printerName?:string, paperWidth?:'58mm'|'80mm', copies?:number, silent?:boolean }}
     * @returns {Promise<{success:boolean, error?:string}>}
     */
    printThermal: (opts) => ipcRenderer.invoke('print:thermal', opts),

    /**
     * Standard A4 invoice print (shows system print dialog unless silent=true).
     * @param {{ printerName?:string, silent?:boolean, copies?:number }}
     * @returns {Promise<{success:boolean, error?:string}>}
     */
    printInvoice: (opts) => ipcRenderer.invoke('print:invoice', opts),

    /**
     * Generates a PDF from the current BrowserWindow page.
     * @param {{ pageSize?:string, landscape?:boolean }}
     * @returns {Promise<{success:boolean, data?:string}>}  data = base64 PDF
     */
    generatePDF: (opts) => ipcRenderer.invoke('pdf:generate', opts),
  },

  // ── PDF Save Dialog ───────────────────────────────────────────────────────────
  pdf: {
    /**
     * Opens Save dialog and writes PDF to disk.
     * @param {string} pdfDataUrl  base64 data URL or raw base64
     * @param {string} fileName    suggested file name
     * @returns {Promise<{success:boolean, filePath?:string}>}
     */
    save: (pdfDataUrl, fileName) => ipcRenderer.invoke('pdf:save', pdfDataUrl, fileName),
  },

  // ── File System ───────────────────────────────────────────────────────────────
  selectLogo: () => ipcRenderer.invoke('file:selectLogo'),

  // ── Notifications ─────────────────────────────────────────────────────────────
  showNotification: (title, body) => ipcRenderer.send('notification:show', { title, body }),

  // ── Updates ───────────────────────────────────────────────────────────────────
  checkForUpdates:    () => ipcRenderer.invoke('update:check'),
  onUpdateAvailable:  (cb) => ipcRenderer.on('update:available', cb),

  // Legacy alias for older callsites
  printInvoice: (html) => ipcRenderer.invoke('print:invoice', {}),
  savePDF:      (buf, name) => ipcRenderer.invoke('pdf:save', buf, name),
});
