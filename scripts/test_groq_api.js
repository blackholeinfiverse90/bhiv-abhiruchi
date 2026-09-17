import fetch from 'node-fetch';

const apiKey = process.env.VITE_GROK_API_KEY || '';
const baseUrl = 'https://api.groq.com/openai/v1';

async function testGroqApi() {
  console.log('🧪 Testing Groq API Key directly...');
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello in 3 words' }]
      })
    });

    const status = res.status;
    const json = await res.json();
    console.log(`Response Status: ${status}`);
    console.log(`Response Body:`, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error testing Groq API:', err.message);
  }
}

testGroqApi();
