const { contextBridge, ipcRenderer } = require('electron');

// 렌더러 프로세스에 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (imageData) => ipcRenderer.invoke('save-image', imageData)
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  // for (const versionType of['chrome', 'electron', 'node']) {
  //     document.getElementById(`${versionType}-version`).innerText = process.versions[versionType]
  // }
  // document.getElementById('serialport-version').innerText = require('serialport/package').version
});
