// Global variables
let selectedFilePath = null;

// Chat functionality
async function ask() {
  const promptInput = document.getElementById('prompt');
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  // Add user message to chat
  const chatOutput = document.getElementById('chat-output');
  chatOutput.innerHTML += `\n<div>You: ${prompt}</div>`;
  
  // Clear input and scroll to bottom
  promptInput.value = '';
  chatOutput.scrollTop = chatOutput.scrollHeight;
  
  // Show loading indicator
  chatOutput.innerHTML += `\n<div class="loading">DeepSeek is thinking...</div>`;
  
  // Get AI response
  try {
    const response = await window.api.askOpenAI(prompt);
    
    // Remove loading indicator
    chatOutput.innerHTML = chatOutput.innerHTML.replace('<div class="loading">DeepSeek is thinking...</div>', '');
    
    // Process response for code blocks
    const formattedResponse = formatResponse(response);
    
    // Add AI message to chat
    chatOutput.innerHTML += `\n<div>DeepSeek: ${formattedResponse}</div>`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  } catch (error) {
    // Remove loading indicator
    chatOutput.innerHTML = chatOutput.innerHTML.replace('<div class="loading">DeepSeek is thinking...</div>', '');
    
    chatOutput.innerHTML += `\n<div class="error">Error: ${error.message}</div>`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
}

// File selection functionality
async function selectFile() {
  const result = await window.api.selectFile();
  
  if (!result.canceled) {
    selectedFilePath = result.filePath;
    
    // Update file info
    const fileInfo = document.getElementById('file-info');
    fileInfo.innerHTML = `
      <h3>Selected File</h3>
      <p><strong>Name:</strong> ${result.fileName}</p>
      <p><strong>Path:</strong> ${result.filePath}</p>
    `;
    
    // Enable analyze button
    document.getElementById('analyze-button').disabled = false;
    
    // Clear previous analysis
    document.getElementById('file-analysis').innerHTML = '<div>Click "Analyze File" to begin analysis.</div>';
  }
}

// File analysis functionality
async function analyzeFile() {
  if (!selectedFilePath) return;
  
  const fileAnalysis = document.getElementById('file-analysis');
  fileAnalysis.innerHTML = '<div class="loading">Analyzing file... This may take a moment.</div>';
  
  // Disable analyze button during analysis
  document.getElementById('analyze-button').disabled = true;
  
  try {
    const result = await window.api.analyzeFile(selectedFilePath);
    
    if (result.success) {
      // Format the analysis with code blocks
      const formattedAnalysis = formatResponse(result.analysis);
      
      fileAnalysis.innerHTML = `
        <h3>Analysis of ${result.fileName}</h3>
        <div>${formattedAnalysis}</div>
      `;
    } else {
      fileAnalysis.innerHTML = `<div class="error">Error analyzing file: ${result.error}</div>`;
    }
  } catch (error) {
    fileAnalysis.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
  
  // Re-enable analyze button
  document.getElementById('analyze-button').disabled = false;
}

// Format response to handle code blocks
function formatResponse(text) {
  // Simple markdown-like formatting for code blocks
  // Replace ```code``` with styled code blocks
  let formatted = text;
  const codeBlockRegex = /```([\s\S]*?)```/g;
  
  formatted = formatted.replace(codeBlockRegex, (match, code) => {
    return `<div class="code-block">${code.trim()}</div>`;
  });
  
  // Replace newlines with <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

// Tab switching functionality
function switchTab(tabName) {
  // Hide all tab contents
  const tabContents = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove('active');
  }
  
  // Deactivate all tabs
  const tabs = document.getElementsByClassName('tab');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
  }
  
  // Activate selected tab and content
  document.getElementById(`${tabName}-tab`).classList.add('active');
  const selectedTabs = document.querySelectorAll(`.tab:nth-child(${tabName === 'chat' ? '1' : '2'})`);
  selectedTabs.forEach(tab => tab.classList.add('active'));
}

// Add event listeners for Enter key
document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('prompt');
  promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      ask();
    }
  });
});