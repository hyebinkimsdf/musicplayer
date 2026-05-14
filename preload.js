const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadPlaylist: () => ipcRenderer.invoke('load-playlist'),
  savePlaylist: (pl) => ipcRenderer.invoke('save-playlist', pl),
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
setOpacity: (v) => ipcRenderer.invoke('set-opacity', v),
  setWindowMode: (mode) => ipcRenderer.invoke('set-window-mode', mode),
  minimize: () => ipcRenderer.invoke('minimize'),
  close: () => ipcRenderer.invoke('close'),
});
