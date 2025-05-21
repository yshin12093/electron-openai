// Terminal functionality
async function executeCommand() {
  const commandInput = document.getElementById('command-input');
  const command = commandInput.value.trim();
  if (!command) return;

  // Add command to terminal output
  const terminalOutput = document.getElementById('terminal-output');
  terminalOutput.innerHTML += `\n<div>$ ${command}</div>`;
  
  // Execute command
  const result = await window.api.executeCommand(command);
  
  // Display result
  if (result.success) {
    if (result.stdout) {
      terminalOutput.innerHTML += `\n<div>${result.stdout}</div>`;
    }
    if (result.stderr) {
      terminalOutput.innerHTML += `\n<div class="command-error">${result.stderr}</div>`;
    }
  } else {
    terminalOutput.innerHTML += `\n<div class="command-error">Error: ${result.error}</div>`;
    if (result.stdout) {
      terminalOutput.innerHTML += `\n<div>${result.stdout}</div>`;
    }
    if (result.stderr) {
      terminalOutput.innerHTML += `\n<div class="command-error">${result.stderr}</div>`;
    }
  }
  
  // Clear input and scroll to bottom
  commandInput.value = '';
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

async function aiCommand() {
  const commandInput = document.getElementById('command-input');
  const prompt = commandInput.value.trim();
  if (!prompt) return;

  // Add user request to terminal output
  const terminalOutput = document.getElementById('terminal-output');
  terminalOutput.innerHTML += `\n<div>🧠 ${prompt}</div>`;
  terminalOutput.innerHTML += `\n<div>Generating command...</div>`;
  
  // Get AI to generate and execute command
  const result = await window.api.aiTerminal(prompt);
  
  // Display result
  if (result.success) {
    terminalOutput.innerHTML += `\n<div class="command-success">$ ${result.command}</div>`;
    if (result.stdout) {
      terminalOutput.innerHTML += `\n<div>${result.stdout}</div>`;
    }
    if (result.stderr) {
      terminalOutput.innerHTML += `\n<div class="command-error">${result.stderr}</div>`;
    }
  } else {
    if (result.command) {
      terminalOutput.innerHTML += `\n<div class="command-error">$ ${result.command}</div>`;
      terminalOutput.innerHTML += `\n<div class="command-error">Error: ${result.error}</div>`;
      if (result.stdout) {
        terminalOutput.innerHTML += `\n<div>${result.stdout}</div>`;
      }
      if (result.stderr) {
        terminalOutput.innerHTML += `\n<div class="command-error">${result.stderr}</div>`;
      }
    } else {
      terminalOutput.innerHTML += `\n<div class="command-error">Error generating command: ${result.error}</div>`;
    }
  }
  
  // Clear input and scroll to bottom
  commandInput.value = '';
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// AI Assistant functionality
async function askAI() {
  const promptInput = document.getElementById('ai-prompt');
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  // Add user message to chat
  const aiChat = document.getElementById('ai-chat');
  aiChat.innerHTML += `<div class="message user-message">${prompt}</div>`;
  
  // Clear input and scroll to bottom
  promptInput.value = '';
  aiChat.scrollTop = aiChat.scrollHeight;
  
  // Get AI response
  try {
    const response = await window.api.askOpenAI(prompt);
    
    // Process response for code blocks
    const formattedResponse = formatAIResponse(response);
    
    // Add AI message to chat
    aiChat.innerHTML += `<div class="message ai-message">${formattedResponse}</div>`;
    aiChat.scrollTop = aiChat.scrollHeight;
  } catch (error) {
    aiChat.innerHTML += `<div class="message ai-message command-error">Error: ${error.message}</div>`;
    aiChat.scrollTop = aiChat.scrollHeight;
  }
}

// Format AI response to handle code blocks
function formatAIResponse(text) {
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
  const selectedTabs = document.querySelectorAll(`.tab:nth-child(${tabName === 'terminal' ? '1' : '2'})`);
  selectedTabs.forEach(tab => tab.classList.add('active'));
}

// Add event listeners for Enter key
document.addEventListener('DOMContentLoaded', () => {
  const commandInput = document.getElementById('command-input');
  commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  });
  
  const aiPrompt = document.getElementById('ai-prompt');
  aiPrompt.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  });
});