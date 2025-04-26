const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

// Setup OpenAI client pointing to DeepSeek
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY || ''
});

// Check if API key is available
if (!process.env.DEEPSEEK_API_KEY) {
  console.warn('Warning: DEEPSEEK_API_KEY not found in environment variables. Please create a .env file based on .env.example');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e'
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

// Execute terminal command
ipcMain.handle('execute-command', async (_event, command) => {
  try {
    console.log(`Executing command: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    return {
      success: true,
      stdout,
      stderr
    };
  } catch (error) {
    console.error('Error executing command:', error);
    return {
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
});

// Handle AI-assisted terminal command execution
ipcMain.handle('ai-terminal', async (_event, prompt) => {
  try {
    // Ask the AI for a terminal command based on the prompt
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that generates terminal commands for macOS. Always respond with ONLY the exact command to run without any explanation, markdown formatting, or backticks. Do not include any text other than the command itself."
        },
        { role: "user", content: `Generate a terminal command to: ${prompt}` }
      ],
      model: "deepseek-chat",
      temperature: 0.3,
      max_tokens: 500
    });

    const command = completion.choices[0].message.content.trim();
    console.log(`AI generated command: ${command}`);
    
    // Execute the command
    try {
      const { stdout, stderr } = await execPromise(command);
      return {
        command,
        success: true,
        stdout,
        stderr
      };
    } catch (error) {
      return {
        command,
        success: false,
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr
      };
    }
  } catch (error) {
    console.error('Error with AI terminal:', error);
    return {
      success: false,
      error: error.message
    };
  }
});
