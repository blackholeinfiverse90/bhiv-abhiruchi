import { grokService } from '../client/src/lib/grokService.js';

// Set API key explicitly for Node test run
grokService.apiKey = process.env.VITE_GROK_API_KEY || grokService.apiKey;

async function testGrokService() {
  console.log('🧪 Testing grokService.generateUniqueQuestions...');
  try {
    const questions = await grokService.generateUniqueQuestions('Logic', 'medium', 3, new Set());
    console.log(`✅ Generated ${questions.length} questions from Groq AI!`);
    console.log('Questions:', JSON.stringify(questions, null, 2));
  } catch (err) {
    console.error('❌ Error in grokService:', err);
  }
}

testGrokService();
