import fetch from 'node-fetch';

const apiKey = process.env.VITE_GROK_API_KEY || '';
const baseUrl = 'https://api.groq.com/openai/v1';

async function testGenerationWithModel(modelName) {
  console.log(`\n🧪 Testing generation with model: ${modelName}...`);
  try {
    const prompt = `Generate 2 unique multiple-choice questions for the category "Logic" at medium difficulty. Return ONLY a valid JSON array of objects with keys: question_text, options (array of 4 strings like ["A)...", "B)...", "C)...", "D)..."]), correct_answer, explanation.`;
    
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const status = res.status;
    const json = await res.json();
    console.log(`Status: ${status}`);
    if (json.choices && json.choices[0]) {
      console.log('✅ Output Content:');
      console.log(json.choices[0].message.content);
    } else {
      console.log('Error output:', json);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  await testGenerationWithModel('groq/compound-mini');
  await testGenerationWithModel('openai/gpt-oss-20b');
}

run();
