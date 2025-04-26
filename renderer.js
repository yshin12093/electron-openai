async function ask() {
    const prompt = document.getElementById('prompt').value;
    const response = await window.api.askOpenAI(prompt);
    document.getElementById('response').innerText = response;
  }