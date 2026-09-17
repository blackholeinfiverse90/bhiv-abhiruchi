import { detectStudyFieldFromBackground } from '../client/src/data/studyFields.js';
import { normalizeCategoryName } from '../client/src/data/assignment.js';
import fieldBasedQuestionService from '../client/src/lib/fieldBasedQuestionService.js';
import { grokService } from '../client/src/lib/grokService.js';

grokService.apiKey = process.env.VITE_GROK_API_KEY || grokService.apiKey;

async function testMongoDBQuestionGeneration() {
  console.log('🧪 Testing MongoDB Question Fetching & Groq AI Storage...\n');

  const studentData = {
    background_field_of_study: 'web_development',
    responses: {
      question_category: 'logic',
      field_of_study: 'Web Development'
    }
  };

  const questions = await fieldBasedQuestionService.generateQuestionsForStudent(studentData, 10);
  const catCounts = {};
  questions.forEach(q => {
    catCounts[q.category] = (catCounts[q.category] || 0) + 1;
  });

  console.log(`✅ Total Questions Returned: ${questions.length}`);
  console.log(`📊 Category Distribution:`, catCounts);
  console.log(`📝 Sample Question:`, questions[0].question_text);
  console.log(`🏷️ Sample Question Source / ID:`, questions[0].id || questions[0].question_id);
}

testMongoDBQuestionGeneration();
