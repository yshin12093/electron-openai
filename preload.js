const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  askOpenAI: (prompt) => ipcRenderer.invoke('ask-openai', prompt),
  selectFile: () => ipcRenderer.invoke('select-file'),
  analyzeFile: (filePath) => ipcRenderer.invoke('analyze-file', filePath)
});
