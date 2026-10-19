/**
 * Electron Preload Script for LPJ BOS Desktop
 * Secure bridge exposing IPC functions to renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPaths: () => ipcRenderer.invoke('app:get-paths'),
  savePhoto: (data) => ipcRenderer.invoke('app:save-photo', data),
  savePdf: (data) => ipcRenderer.invoke('app:save-pdf', data),
});
