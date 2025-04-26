const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const pdfParse = require('pdf-parse');
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

// Handle file selection dialog
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'Code Files', extensions: ['js', 'py', 'html', 'css', 'json', 'ts', 'jsx', 'tsx'] },
      { name: 'PDF Files', extensions: ['pdf'] }
    ]
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  const filePath = result.filePaths[0];
  return { 
    canceled: false, 
    filePath,
    fileName: path.basename(filePath)
  };
});

// Function to extract text from PDF
async function extractPdfText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Handle file analysis
ipcMain.handle('analyze-file', async (_event, filePath) => {
  try {
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(filePath).substring(1).toLowerCase(); // Remove the dot and convert to lowercase
    
    // Handle different file types
    let fileContent;
    
    if (fileExtension === 'pdf') {
      // Extract text from PDF
      fileContent = await extractPdfText(filePath);
      console.log(`Extracted ${fileContent.length} characters from PDF`);
    } else {
      // Read text-based files directly
      fileContent = fs.readFileSync(filePath, 'utf8');
    }
    
    // Prepare the prompt for file analysis
    const prompt = `Summarize the following ${fileExtension} file named '${fileName}':\n\n${fileContent}\n\nProvide a detailed analysis including:\n1. A summary of what this file does\n2. Key components or functions\n3. Potential issues or improvements\n4. Best practices that could be applied`;
    
    // Truncate if the prompt is too long
    const maxLength = 12000; // DeepSeek has a token limit
    const truncatedPrompt = prompt.length > maxLength 
      ? prompt.substring(0, maxLength) + '\n\n[Content truncated due to length...]' 
      : prompt;
    
    // Call the AI to analyze the file
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert summarizer. Provide a clear, concise summary of the document." },
        { role: "user", content: truncatedPrompt }
      ],
      model: "deepseek-chat",
      temperature: 0.5,
      max_tokens: 2000
    });

    return {
      success: true,
      fileName,
      fileType: fileExtension,
      analysis: completion.choices[0].message.content
    };
  } catch (error) {
    console.error('Error analyzing file:', error);
    return {
      success: false,
      error: error.message
    };
  }
});
