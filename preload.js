const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  askOpenAI: (prompt) => ipcRenderer.invoke('ask-openai', prompt),
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command),
  aiTerminal: (prompt) => ipcRenderer.invoke('ai-terminal', prompt)
});
