import { supabase } from '../client/src/lib/supabaseClient.js';
import { aiSettingsService } from '../client/src/lib/aiSettingsService.js';
import { grokService } from '../client/src/lib/grokService.js';

async function checkQuestionSources() {
  console.log('🔍 Checking Supabase question_banks Table...');
  try {
    const { data: dbQuestions, error, count } = await supabase
      .from('question_banks')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Supabase error:', error.message);
    } else {
      console.log(`✅ Total Questions in DB: ${dbQuestions ? dbQuestions.length : 0}`);
      if (dbQuestions && dbQuestions.length > 0) {
        const catMap = {};
        dbQuestions.forEach(q => {
          const cat = q.category || q.category_id || 'Unknown';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        console.log('📊 DB Questions per Category:', catMap);
        console.log('📝 Sample DB Question:', dbQuestions[0].question_text);
      } else {
        console.log('⚠️ Supabase question_banks table is EMPTY or returned 0 rows!');
      }
    }

    console.log('\n🤖 Checking AI Question Generation Settings...');
    const isAIEnabled = await aiSettingsService.isAIEnabled();
    console.log(`  AI Enabled globally: ${isAIEnabled}`);
    console.log(`  Grok API Key present: ${!!grokService.apiKey}`);

  } catch (err) {
    console.error('❌ Error during check:', err.message);
  }
}

checkQuestionSources();
