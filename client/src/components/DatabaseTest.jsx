import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DynamicFieldService } from '../lib/dynamicFieldService';
import ApiClient from '../lib/apiClient';

const DatabaseTest = () => {
  const [results, setResults] = useState({
    studyFields: [],
    dynamicFields: [],
    questions: [],
    mappings: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test 1: Direct MERN / Supabase query for study_fields
      let studyFieldsData = [];
      try {
        const fRes = await ApiClient.get('/fields');
        const list = fRes?.data || fRes?.fields || (Array.isArray(fRes) ? fRes : []);
        if (Array.isArray(list) && list.length > 0) {
          studyFieldsData = list;
        }
      } catch (e) {
        console.warn('MERN /fields check failed:', e.message);
      }

      if (!studyFieldsData || studyFieldsData.length === 0) {
        const { data } = await supabase
          .from('study_fields')
          .select('*')
          .order('created_at', { ascending: true });
        if (data) studyFieldsData = data;
      }

      // Test 2: DynamicFieldService
      const dynamicFields = await DynamicFieldService.getAllFields();

      // Test 3: Question banks
      let questionsData = [];
      try {
        const qRes = await ApiClient.get('/questions');
        const list = qRes?.data || qRes?.questions || (Array.isArray(qRes) ? qRes : []);
        if (Array.isArray(list) && list.length > 0) {
          questionsData = list;
        }
      } catch (e) {
        console.warn('MERN /questions check failed:', e.message);
      }

      if (!questionsData || questionsData.length === 0) {
        const { data } = await supabase
          .from('question_banks')
          .select('*')
          .limit(10);
        if (data) questionsData = data;
      }

      // Test 4: Question field mappings
      const { data: mappingsData } = await supabase
        .from('question_field_mapping')
        .select('*')
        .limit(10);

      setResults({
        studyFields: studyFieldsData || [],
        dynamicFields: dynamicFields || [],
        questions: questionsData || [],
        mappings: mappingsData || [],
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Database test failed:', error);
      setResults(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  if (results.loading) {
    return (
      <div className="p-6 bg-white/10 rounded-xl border border-orange-400/30">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p>Testing database connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/10 rounded-xl border border-orange-400/30 space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        🔍 Database Connection Test
        <button 
          onClick={testDatabaseConnection}
          className="text-sm px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30"
        >
          Refresh
        </button>
      </h3>

      {results.error && (
        <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200">
          <strong>Error:</strong> {results.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Study Fields */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">📋 Study Fields ({results.studyFields.length})</h4>
          {results.studyFields.length > 0 ? (
            <div className="space-y-2">
              {results.studyFields.map(field => (
                <div key={field.field_id} className="text-sm text-white/80 flex items-center gap-2">
                  <span>{field.icon}</span>
                  <span>{field.name}</span>
                  <span className="text-xs text-white/50">({field.field_id})</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white/50">No study fields found</div>
          )}
        </div>

        {/* Dynamic Fields */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">🔧 Dynamic Fields ({results.dynamicFields.length})</h4>
          {results.dynamicFields.length > 0 ? (
            <div className="space-y-2">
              {results.dynamicFields.map(field => (
                <div key={field.field_id} className="text-sm text-white/80 flex items-center gap-2">
                  <span>{field.icon}</span>
                  <span>{field.name}</span>
                  <span className="text-xs text-white/50">({field.field_id})</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white/50">No dynamic fields loaded</div>
          )}
        </div>

        {/* Questions */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">❓ Questions ({results.questions.length})</h4>
          {results.questions.length > 0 ? (
            <div className="space-y-2">
              {results.questions.slice(0, 3).map(question => (
                <div key={question.question_id} className="text-sm text-white/80">
                  <div className="font-medium">{question.question_text.substring(0, 50)}...</div>
                  <div className="text-xs text-white/50">{question.category} • {question.difficulty}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white/50">No questions found</div>
          )}
        </div>

        {/* Mappings */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">🔗 Field Mappings ({results.mappings.length})</h4>
          {results.mappings.length > 0 ? (
            <div className="space-y-2">
              {results.mappings.slice(0, 3).map(mapping => (
                <div key={mapping.id} className="text-sm text-white/80">
                  <div>{mapping.question_id} → {mapping.field_id}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-white/50">No field mappings found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseTest;
