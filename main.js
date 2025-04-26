const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');

// Setup OpenAI client pointing to DeepSeek
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: 'sk-9aa0ba5eae634ad6a8e1325bd65bc263'
});

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Handle the 'ask-openai' event from renderer
ipcMain.handle('ask-openai', async (_event, prompt) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    
    // Return the error message to the renderer
    if (error.response) {
      return `Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else {
      return `Error: ${error.message}`;
    }
  }
});
