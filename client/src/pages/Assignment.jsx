import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Assignment from '../components/Assignment';
import AssignmentResults from '../components/AssignmentResults';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { useI18n } from "../lib/i18n";
import { scoringService } from '../lib/scoringService';
import { supabase } from '../lib/supabaseClient';
import ApiClient from '../lib/apiClient';

export default function AssignmentPage() {
  const [currentView, setCurrentView] = useState('assignment'); // 'assignment', 'evaluating', 'results'
  const { t } = useI18n();
  const [_assignmentAttempt, setAssignmentAttempt] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const { user } = useAuth();

  const handleAssignmentComplete = async (attempt) => {
    setAssignmentAttempt(attempt);
    setCurrentView('evaluating');

    // Show evaluation progress
    const evaluationToast = toast.loading(t('assignment.evaluatingSubtitle'));

    try {
      // Prepare user context for evaluation
      const userContext = user ? {
        id: user.id || user._id,
        name: user.full_name || 'Student',
        email: user.email
      } : null;

      console.log('🎯 Starting evaluation with user context:', userContext);

      // Evaluate the assignment with user context
      const results = await scoringService.evaluateAssignmentAttempt(attempt, userContext);

      // Store results in database if user is logged in
      if (user) {
        await storeAssignmentResults(attempt, results);
      }

      setEvaluationResults(results);
      setCurrentView('results');

      toast.success('Assignment evaluated successfully!', { id: evaluationToast });
    } catch (error) {
      console.error('Error evaluating assignment:', error);

      // Show specific error message
      let errorMessage = 'Failed to evaluate assignment. Please try again.';
      if (error.message.includes('API key')) {
        errorMessage = 'Evaluation service is not properly configured. Please contact support.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }

      toast.error(errorMessage, { id: evaluationToast });
      setCurrentView('assignment');
    }
  };

  const storeAssignmentResults = async (attempt, results) => {
    console.log('💾 Starting to store assignment results...');

    try {
      if (!user) {
        console.warn('⚠️ User not authenticated, skipping data storage');
        return;
      }

      // 1. Save results to MERN Express Backend (MongoDB)
      let mernSaved = false;
      try {
        const payload = {
          user_id: user.id || user._id,
          assessment_id: attempt.assignment_id || `assign_${Date.now()}`,
          score: results.total_score,
          total_questions: results.max_score / 10 || 10,
          domains: user.selected_domains || [user.field_of_study || 'stem'],
          results: {
            percentage: results.percentage,
            grade: results.grade,
            overall_feedback: results.overall_feedback,
            strengths: results.strengths,
            improvement_areas: results.improvement_areas,
            evaluated_responses: results.evaluated_responses,
            time_taken_seconds: attempt.time_taken_seconds
          }
        };

        const apiRes = await ApiClient.post('/students/assessment-result', payload);
        if (apiRes && apiRes.success) {
          console.log('✅ Successfully stored assignment results in MERN MongoDB:', apiRes.data);
          mernSaved = true;
        }
      } catch (mernErr) {
        console.warn('Could not store results in MERN backend:', mernErr.message);
      }

      // 2. Try Supabase as secondary / fallback if configured
      try {
        const userEmail = user?.email;
        let studentRecord = null;

        const { data: existingStudent } = await supabase
          .from('students')
          .select('id, name, email')
          .eq('user_id', user.id || user._id)
          .maybeSingle();

        if (existingStudent) {
          studentRecord = existingStudent;
        }

        const assignmentData = {
          user_id: user.id || user._id,
          student_id: studentRecord?.id || null,
          user_email: userEmail,
          assignment_id: attempt.assignment_id,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          time_taken_seconds: attempt.time_taken_seconds,
          total_score: results.total_score,
          max_score: results.max_score,
          percentage: results.percentage,
          grade: results.grade,
          category_scores: results.category_scores,
          overall_feedback: results.overall_feedback,
          strengths: results.strengths,
          improvement_areas: results.improvement_areas,
          auto_submitted: attempt.auto_submitted || false,
          evaluated_at: results.evaluated_at
        };

        const { data: attemptData } = await supabase
          .from('assignment_attempts')
          .insert([assignmentData])
          .select()
          .maybeSingle();

        if (attemptData) {
          const responseData = (results.evaluated_responses || []).map(response => ({
            attempt_id: attemptData.id,
            question_id: response.question_id,
            question_category: response.question_category,
            question_difficulty: response.question_difficulty,
            user_answer: response.user_answer,
            user_explanation: response.user_explanation,
            correct_answer: response.correct_answer,
            is_correct: response.is_correct,
            accuracy_score: response.accuracy_score,
            explanation_score: response.explanation_score,
            reasoning_score: response.reasoning_score,
            total_score: response.total_score,
            max_score: response.max_score,
            ai_feedback: response.ai_feedback,
            suggestions: response.suggestions,
            evaluated_at: response.evaluated_at
          }));

          await supabase.from('assignment_responses').insert(responseData);
        }
      } catch (sbErr) {
        console.warn('Supabase storage fallback error:', sbErr.message);
      }

      if (mernSaved) {
        console.log('✅ Assignment results saved to MongoDB successfully.');
      }
    } catch (error) {
      console.error('💥 Error storing assignment results:', error);
    }
  };

  const handleRetakeAssignment = () => {
    setCurrentView('assignment');
    setAssignmentAttempt(null);
    setEvaluationResults(null);
  };

  const handleBackToDashboard = () => {
    // Navigate back to dashboard
    window.location.href = '/dashboard';
  };

  if (currentView === 'evaluating') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">{t('assignment.evaluatingTitle')}</h2>
            <p className="text-white/70">{t('assignment.evaluatingSubtitle')}</p>
            <div className="text-sm text-white/60">
              {t('assignment.checkingAccuracy')} • {t('assignment.evaluatingExplanation')} • {t('assignment.analyzingReasoning')}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-orange-400">{t('assignment.checkingAccuracy')}</div>
            <div className="text-sm text-orange-400">{t('assignment.evaluatingExplanation')}</div>
            <div className="text-sm text-orange-400">{t('assignment.analyzingReasoning')}</div>
            <div className="text-sm text-white/60">{t('assignment.generatingFeedback')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'results' && evaluationResults) {
    return (
      <ErrorBoundary fallbackMessage="Failed to display assignment results. Your evaluation was successful, but there was an error showing the results.">
        <AssignmentResults
          results={evaluationResults}
          onRetakeAssignment={handleRetakeAssignment}
          onBackToDashboard={handleBackToDashboard}
        />
      </ErrorBoundary>
    );
  }

  return (
    <Assignment
      onComplete={handleAssignmentComplete}
      userId={user?.id}
      userEmail={user?.email}
    />
  );
}
