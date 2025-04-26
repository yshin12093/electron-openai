const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  askOpenAI: (prompt) => ipcRenderer.invoke('ask-openai', prompt)
});
