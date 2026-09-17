import fetch from 'node-fetch';

const apiKey = process.env.VITE_GROK_API_KEY || '';
const baseUrl = 'https://api.groq.com/openai/v1';

async function checkModels() {
  console.log('🔍 Listing available models from Groq API...');
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const json = await res.json();
    if (json.data) {
      console.log('✅ Active Groq Models:');
      json.data.forEach(m => console.log(`   - ${m.id}`));
    } else {
      console.log('Response:', json);
    }
  } catch (err) {
    console.error('Error fetching Groq models:', err.message);
  }
}

checkModels();
