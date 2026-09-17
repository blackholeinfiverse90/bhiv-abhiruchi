import fieldBasedQuestionService from '../client/src/lib/fieldBasedQuestionService.js';
import { grokService } from '../client/src/lib/grokService.js';

grokService.apiKey = process.env.VITE_GROK_API_KEY || grokService.apiKey;

const categoriesToTest = ['coding', 'logic', 'mathematics', 'language', 'culture', 'vedic_knowledge', 'current_affairs'];

async function runCategoryTests() {
  console.log('🧪 Starting Category Isolation & Deduplication Tests across all categories...\n');

  for (const cat of categoriesToTest) {
    const studentData = {
      background_field_of_study: 'stem',
      responses: {
        question_category: cat,
        field_of_study: 'STEM'
      }
    };

    const questions = await fieldBasedQuestionService.generateQuestionsForStudent(studentData, 10);
    const catCounts = {};
    const questionTexts = new Set();
    let dupCount = 0;

    questions.forEach((q) => {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
      const norm = (q.question_text || '').toLowerCase().trim();
      if (questionTexts.has(norm)) dupCount++;
      questionTexts.add(norm);
    });

    console.log(`📌 Category Selection: "${cat}"`);
    console.log(`   - Total Returned: ${questions.length}`);
    console.log(`   - Category breakdown:`, catCounts);
    console.log(`   - Duplicates: ${dupCount}`);
    console.log('----------------------------------------------------');
  }
}

runCategoryTests().catch(err => console.error('❌ Test failed:', err));
