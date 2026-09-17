import fieldBasedQuestionService from '../client/src/lib/fieldBasedQuestionService.js';

async function testQuestionDistribution() {
  console.log('🧪 Testing Multi-Subject Question Generation across Study Fields...\n');

  const fields = [
    { key: 'stem', label: 'STEM' },
    { key: 'business', label: 'Business & Economics' },
    { key: 'creative_arts', label: 'Creative Arts & Humanities' },
    { key: 'health_medicine', label: 'Health & Medicine' },
    { key: 'social_sciences', label: 'Social Sciences' },
    { key: 'other', label: 'Other Fields' }
  ];

  for (const field of fields) {
    console.log(`📌 === Study Field: ${field.label} (${field.key}) ===`);
    try {
      const studentData = { background_field_of_study: field.key };
      const questions = await fieldBasedQuestionService.generateQuestionsForStudent(studentData, 10);
      
      const counts = {};
      questions.forEach(q => {
        counts[q.category] = (counts[q.category] || 0) + 1;
      });

      console.log(`  ✅ Generated ${questions.length} questions`);
      console.log(`  📊 Category Distribution:`, counts);
      console.log('');
    } catch (err) {
      console.error(`  ❌ Error:`, err.message);
    }
  }
}

testQuestionDistribution();
