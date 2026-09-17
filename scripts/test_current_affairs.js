import fieldBasedQuestionService from '../client/src/lib/fieldBasedQuestionService.js';
import { grokService } from '../client/src/lib/grokService.js';

grokService.apiKey = process.env.VITE_GROK_API_KEY || grokService.apiKey;

async function testCurrentAffairsCategory() {
  console.log('🧪 Testing Current Affairs Category Isolation & Non-Repeating Questions...\n');

  const studentData = {
    background_field_of_study: 'stem',
    responses: {
      question_category: 'current_affairs',
      field_of_study: 'STEM'
    }
  };

  const questions = await fieldBasedQuestionService.generateQuestionsForStudent(studentData, 10);
  
  const catCounts = {};
  const questionTexts = new Set();
  const duplicates = [];

  questions.forEach((q, idx) => {
    catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    const textNorm = (q.question_text || '').toLowerCase().trim();
    if (questionTexts.has(textNorm)) {
      duplicates.push(q.question_text);
    }
    questionTexts.add(textNorm);
  });

  console.log(`✅ Total Questions Returned: ${questions.length}`);
  console.log(`📊 Category Distribution:`, catCounts);
  console.log(`🔁 Duplicates Found: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log(`⚠️ Duplicated Questions:`, duplicates);
  }

  console.log('\n📝 Questions List:');
  questions.forEach((q, i) => {
    console.log(`${i+1}. [${q.category}] ${q.question_text}`);
  });
}

testCurrentAffairsCategory().catch(err => {
  console.error('❌ Test failed:', err);
});
