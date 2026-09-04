// Example: How to integrate multi-domain system into existing Assignment.jsx
// This shows the minimal changes needed to your existing component

import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import MultiDomainAssessmentService from '../lib/multiDomainAssessmentService';
import DomainSelector from './DomainSelector';
import MultiDomainResults from './MultiDomainResults';
import AIAssistanceDetector from '../lib/aiAssistanceDetector';

export default function AssignmentWithDomains() {
  const { user } = useUser();
  const [stage, setStage] = useState('domain_selection'); // domain_selection, assessment, results
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState(null);

  // STAGE 1: Domain Selection
  const handleDomainsSelected = async (domains) => {
    console.log('Domains selected:', domains);
    setSelectedDomains(domains);

    try {
      // Generate adaptive multi-domain assessment
      const assessmentData = await MultiDomainAssessmentService.generateMultiDomainAssessment(
        domains,
        10, // Total questions
        user?.id
      );

      console.log('Assessment generated:', assessmentData.metadata);
      setAssessment(assessmentData);
      setQuestions(assessmentData.questions);
      
      // Initialize empty responses
      setUserResponses(
        assessmentData.questions.map(() => ({
          selected_option: '',
          text_answer: '',
          explanation: '',
          time_taken_seconds: 0,
          is_correct: false,
          total_score: 0
        }))
      );

      // Save domain selection to database
      await MultiDomainAssessmentService.saveStudentDomainSelection(
        user?.id,
        domains,
        assessmentData.metadata.generatedAt
      );

      setStage('assessment');
    } catch (error) {
      console.error('Error generating assessment:', error);
      alert('Failed to generate assessment. Please try again.');
    }
  };

  // STAGE 2: Handle answer submission
  const handleAnswerSubmit = (questionIndex, answer, explanation, timeSpent) => {
    const updatedResponses = [...userResponses];
    const question = questions[questionIndex];

    // Check if correct
    const isCorrect = answer === question.correct_answer;

    // AI detection on explanation
    let aiAnalysis = null;
    if (explanation) {
      aiAnalysis = AIAssistanceDetector.analyzeResponse(
        explanation,
        question.question_text,
        timeSpent
      );
    }

    updatedResponses[questionIndex] = {
      selected_option: answer,
      text_answer: answer,
      explanation: explanation || '',
      time_taken_seconds: timeSpent,
      is_correct: isCorrect,
      accuracy_score: isCorrect ? 10 : 0,
      explanation_score: aiAnalysis ? (100 - aiAnalysis.suspicionScore) / 10 : 5,
      reasoning_score: aiAnalysis ? aiAnalysis.context / 10 : 5,
      total_score: isCorrect ? 10 : 0,
      ai_analysis: aiAnalysis
    };

    setUserResponses(updatedResponses);
  };

  // STAGE 3: Submit assessment
  const handleAssessmentComplete = async () => {
    const totalScore = userResponses.reduce((sum, r) => sum + r.total_score, 0);
    const maxScore = questions.length * 10;
    const totalTime = userResponses.reduce((sum, r) => sum + r.time_taken_seconds, 0);

    // Run batch AI analysis
    const aiAnalysis = AIAssistanceDetector.analyzeMultipleResponses(
      userResponses.map(r => r.explanation || ''),
      questions,
      userResponses.map(r => r.time_taken_seconds)
    );

    // Generate AI feedback using Groq (if configured)
    let aiFeedback = '';
    try {
      // TODO: Integrate with your existing Groq API service
      aiFeedback = 'Great effort! Continue practicing.';
    } catch (error) {
      console.error('Error generating AI feedback:', error);
    }

    const resultsData = {
      total_score: totalScore,
      max_score: maxScore,
      time_taken_seconds: totalTime,
      category_scores: calculateDomainScores(),
      ai_feedback: aiFeedback,
      ai_detection: aiAnalysis,
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    setResults(resultsData);
    setStage('results');
  };

  const calculateDomainScores = () => {
    const domainScores = {};
    questions.forEach((q, index) => {
      const domain = q.category;
      if (!domainScores[domain]) {
        domainScores[domain] = { score: 0, total: 0 };
      }
      domainScores[domain].score += userResponses[index]?.total_score || 0;
      domainScores[domain].total += 10;
    });
    return domainScores;
  };

  const handleRetake = () => {
    setStage('domain_selection');
    setSelectedDomains([]);
    setQuestions([]);
    setUserResponses([]);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* STAGE 1: Domain Selection */}
      {stage === 'domain_selection' && (
        <DomainSelector
          onDomainsSelected={handleDomainsSelected}
          initialDomains={selectedDomains}
        />
      )}

      {/* STAGE 2: Assessment in Progress */}
      {stage === 'assessment' && (
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-4 text-white">
            <h2 className="text-2xl font-bold mb-2">Multi-Domain Assessment</h2>
            <p className="text-gray-400">
              Domains: {selectedDomains.map(d => d.replace('_', ' ')).join(', ')}
            </p>
            <p className="text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            {assessment?.metadata && (
              <p className="text-sm text-purple-400">
                {assessment.metadata.adaptiveLevel}
              </p>
            )}
          </div>

          {/* Your existing question display component */}
          {questions[currentQuestionIndex] && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                {questions[currentQuestionIndex].question_text}
              </h3>
              
              {/* Domain tag */}
              <div className="mb-4">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  {questions[currentQuestionIndex].category}
                </span>
                <span className="ml-2 px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                  {questions[currentQuestionIndex].difficulty}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {JSON.parse(questions[currentQuestionIndex].options || '[]').map((option, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleAnswerSubmit(currentQuestionIndex, option, '', 30);
                    }}
                    className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-4">
                {currentQuestionIndex > 0 && (
                  <button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg"
                  >
                    Previous
                  </button>
                )}
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleAssessmentComplete}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Complete Assessment
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: Results */}
      {stage === 'results' && results && (
        <MultiDomainResults
          results={results}
          questions={questions}
          userResponses={userResponses}
          selectedDomains={selectedDomains}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
