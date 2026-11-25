import { AlertCircle, BookOpen, Brain, Calculator, Clock, Code, Globe, Newspaper, Scroll, MessageCircle, HelpCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ASSIGNMENT_CONFIG } from '../data/assignment';
import { fieldBasedQuestionService } from '../lib/fieldBasedQuestionService';
import { supabase, SUPABASE_TABLE } from '../lib/supabaseClient';
import { backgroundSelectionService } from '../lib/backgroundSelectionService';
import { DynamicQuestionCategoryService } from '../lib/dynamicQuestionCategoryService';
import { useAssessmentGuard } from '../context/AssessmentGuardContext';
import { useAuth } from '../context/AuthContext';
import ApiClient from '../lib/apiClient';

// Icon mapping for question categories (supports dynamic categories)
const DEFAULT_CATEGORY_ICONS = {
  Code,
  Brain,
  Calculator,
  BookOpen,
  Globe,
  Scroll,
  Newspaper,
  MessageCircle,
  HelpCircle
};

// Helper function to get icon component by name
const getIconComponent = (iconName, category) => {
  if (iconName && DEFAULT_CATEGORY_ICONS[iconName]) {
    return DEFAULT_CATEGORY_ICONS[iconName];
  }
  // Fallback to category-based mapping for backward compatibility
  const legacyIcons = {
    'Coding': Code,
    'Logic': Brain,
    'Mathematics': Calculator,
    'Language': MessageCircle,
    'Culture': Globe,
    'Vedic Knowledge': Scroll,
    'Current Affairs': Newspaper
  };
  return legacyIcons[category] || BookOpen;
};

function QuestionCard({ question, questionNumber, totalQuestions, userAnswer, onAnswerChange, onExplanationChange, userExplanation, categories }) {
  const IconComponent = getIconComponent(
    categories?.find(cat => cat.name === question.category)?.icon,
    question.category
  );

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/70 backdrop-blur-xl p-5 sm:p-7 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-400/25">
            <IconComponent className="h-4 w-4 flex-shrink-0 text-orange-400" />
            <span className="text-xs font-semibold text-orange-300">{question.category}</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 text-white/75 whitespace-nowrap font-medium">
            {question.difficulty}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-white/55 font-medium whitespace-nowrap tabular-nums">
          Question {questionNumber} of {totalQuestions || ASSIGNMENT_CONFIG.TOTAL_QUESTIONS}
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug">{question.question_text}</h3>

        <div className="space-y-2.5">
          {(Array.isArray(question.options) ? question.options : []).map((option, index) => (
            <label
              key={index}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                userAnswer === option
                  ? 'border-orange-500/75 bg-orange-500/15 shadow-sm'
                  : 'border-white/15 bg-slate-900/70 hover:bg-slate-900 hover:border-white/25'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={userAnswer === option}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="text-orange-400 shrink-0"
              />
              <span className="text-sm sm:text-base text-white/95 leading-snug">{option}</span>
            </label>
          ))}
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs sm:text-sm font-medium text-white/75">
            Explain your reasoning (optional but recommended for better scoring):
          </label>
          <textarea
            value={userExplanation || ''}
            onChange={(e) => onExplanationChange(question.id, e.target.value)}
            placeholder="Explain why you chose this answer..."
            className="w-full p-3.5 rounded-xl bg-slate-900/75 border border-white/15 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/80 transition-all"
            rows={3}
          />
        </div>

        {question.vedic_connection && (
          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-400/25">
            <div className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">Vedic Connection</div>
            <div className="text-sm text-white/80 leading-relaxed">{question.vedic_connection}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Timer({ timeRemaining, totalTime }) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / totalTime) * 100;

  return (
    <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/15 shadow-lg h-full">
      <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-400/25 shrink-0">
        <Clock className="h-5 w-5 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
          <span className="text-white/75 font-medium">Time Remaining</span>
          <span className={`font-mono font-semibold tabular-nums ${timeRemaining < 300 ? 'text-red-400' : 'text-white'}`}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              percentage > 20 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ProgressIndicator({ currentQuestion, totalQuestions, answeredQuestions }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/15 shadow-lg space-y-2.5 h-full">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-white/75 font-medium">Progress</span>
        <span className="text-white font-semibold tabular-nums">
          {answeredQuestions.size} of {totalQuestions} answered
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-2 rounded-full bg-orange-500 transition-all duration-300"
          style={{ width: `${(answeredQuestions.size / totalQuestions) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-10 gap-1 pt-0.5">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full ${
              i < currentQuestion
                ? answeredQuestions.has(i)
                  ? 'bg-emerald-500'
                  : 'bg-red-400'
                : i === currentQuestion
                ? 'bg-orange-500'
                : 'bg-white/15'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Assignment({ onComplete, userId = null, userEmail = null }) {
  const { setIsAssessmentActive, setCancelCallback } = useAssessmentGuard();
  const [categories, setCategories] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [userExplanations, setUserExplanations] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasInitializedRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const isMountedRef = useRef(true);

  const ASSIGNMENT_LOAD_TOAST_ID = 'assignment-load-toast';

  // Sync active assessment guard state with loading / in-progress assessment
  useEffect(() => {
    if (loading || (assignment && !isSubmitted)) {
      setIsAssessmentActive(true);
      setCancelCallback(() => () => {
        toast.dismiss(ASSIGNMENT_LOAD_TOAST_ID);
        isGeneratingRef.current = false;
        setLoading(false);
        setLoadingProgress(0);
        setLoadingMessage('');
      });
    } else {
      setIsAssessmentActive(false);
    }
    return () => setIsAssessmentActive(false);
  }, [loading, assignment, isSubmitted, setIsAssessmentActive, setCancelCallback]);

  // Load categories and assignment once per component instance (prevents React StrictMode double generation)
  useEffect(() => {
    isMountedRef.current = true;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadCategoriesAndAssignment();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCategoriesAndAssignment = async () => {
    toast.dismiss(ASSIGNMENT_LOAD_TOAST_ID);
    setLoading(true);
    setLoadingProgress(5);
    setLoadingMessage('Loading assessment categories...');

    await loadAssignment();
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const { user: authUser } = useAuth();

  const loadAssignment = async () => {
    if (isGeneratingRef.current) {
      return;
    }
    isGeneratingRef.current = true;

    // Clear any existing assignment loading toast before starting
    toast.dismiss(ASSIGNMENT_LOAD_TOAST_ID);
    
    setLoading(true);
    setLoadingProgress(10);
    setLoadingMessage('Fetching student profile & categories...');

    const loadingToast = toast.loading(
      'Generating your personalized field-based assessment...',
      { id: ASSIGNMENT_LOAD_TOAST_ID }
    );

    // Progress callback to update UI from real milestones
    const progressCallback = (message, progress) => {
      if (!isMountedRef.current) return;
      setLoadingMessage(message);
      setLoadingProgress(progress);
      console.log(`📊 Progress: ${progress.toFixed(1)}% - ${message}`);
    };

    try {
      const uId = userId || authUser?.id || authUser?._id;
      let studentData = {
        user_id: uId,
        name: authUser?.full_name,
        email: userEmail,
        field_of_study: authUser?.field_of_study || 'stem',
        responses: authUser?.intake_data || {}
      };

      // 1. Merge local intake immediately
      const localIntakeStr = (uId ? localStorage.getItem('gurukul_intake_' + uId) : null) || localStorage.getItem('background_selection');
      if (localIntakeStr) {
        try {
          const parsed = JSON.parse(localIntakeStr);
          studentData = {
            ...studentData,
            ...parsed,
            field_of_study: parsed.field_of_study || parsed.fieldOfStudy || studentData.field_of_study,
            responses: {
              ...studentData.responses,
              ...parsed
            }
          };
        } catch (e) {
          console.warn('Could not parse local intake data:', e);
        }
      }

      // 2. Fetch categories & backend student profile in parallel
      const [catResult, profileResult] = await Promise.allSettled([
        DynamicQuestionCategoryService.getAllCategories(),
        uId ? ApiClient.get(`/students/profile/${uId}`) : Promise.resolve(null)
      ]);

      if (catResult.status === 'fulfilled' && isMountedRef.current) {
        setCategories(catResult.value);
      }

      if (profileResult.status === 'fulfilled' && profileResult.value?.data) {
        const apiData = profileResult.value.data;
        const apiIntake = apiData.intake_data || {};
        studentData = {
          ...studentData,
          ...apiData,
          responses: {
            ...apiIntake,
            ...studentData.responses
          }
        };
      }

      progressCallback('Profile & field detected, preparing AI prompt...', 30);

      // Generate questions based on student's field with real live stream progress (35% -> 95%)
      const rawQuestions = await fieldBasedQuestionService.generateQuestionsForStudent(
        studentData,
        ASSIGNMENT_CONFIG.TOTAL_QUESTIONS,
        progressCallback
      );
      progressCallback('Finalizing assessment...', 96);
      // Normalize questions to ensure required fields and validate non-empty list
      const questions = Array.isArray(rawQuestions)
        ? rawQuestions
            .filter(q => q && (q.id || q.question_id || q.questionId || q.question_text || q.text))
            .map((q, index) => ({
              ...q,
              id: q?.id ?? q?.question_id ?? q?.questionId ?? `q_${index + 1}`,
              question_text: q?.question_text ?? q?.text ?? '',
              category: q?.category ?? 'General',
              difficulty: q?.difficulty ?? 'Medium',
              options: Array.isArray(q?.options) ? q.options : [],
              correct_answer: q?.correct_answer ?? q?.correctAnswer ?? q?.answer ?? (Array.isArray(q?.options) ? q.options[0] : ''),
              explanation: typeof q?.explanation === 'string' ? q.explanation : ''
            }))
        : [];
      if (!questions.length) {
        throw new Error('questions_generation_failed: no questions available');
      }

      const generatedAssignment = {
        id: `field_assessment_${Date.now()}`,
        title: 'Field-Based Assessment',
        description: 'Personalized assessment based on your study field and background',
        questions: questions,
        student_field: studentData.field_of_study || 'General',
        created_at: new Date().toISOString()
      };

      progressCallback('Assignment ready!', 100);
      
      if (!isMountedRef.current) {
        toast.dismiss(loadingToast);
        return;
      }

      setAssignment(generatedAssignment);
      setTimeRemaining(ASSIGNMENT_CONFIG.TIME_LIMIT_MINUTES * 60);
      setStartTime(new Date());

      toast.success('Field-based assignment loaded successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Failed to load assignment:', error);

      if (!isMountedRef.current) {
        toast.dismiss(loadingToast);
        return;
      }

      // Show specific error message based on error type
      let errorMessage = 'Failed to generate assignment. Please try again.';
      if (error.message.includes('student')) {
        errorMessage = 'Could not load student profile. Using default question set.';
      } else if (error.message.includes('questions')) {
        errorMessage = 'Could not generate enough questions for your field. Please try again.';
      } else if (error.message.includes('field')) {
        errorMessage = 'Could not determine your study field. Using general questions.';
      }

      // Use the same toast ID to update the loading toast instead of creating a new one
      toast.error(errorMessage, { id: loadingToast });
      setAssignment(null); // Ensure assignment is null on error
    } finally {
      isGeneratingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingProgress(0);
        setLoadingMessage('');
      }
    }
  };

  const handleAnswerChange = useCallback((questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const handleExplanationChange = useCallback((questionId, explanation) => {
    setUserExplanations(prev => ({
      ...prev,
      [questionId]: explanation
    }));
  }, []);

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !showConfirmSubmit) {
      setShowConfirmSubmit(true);
      return;
    }

    const endTime = new Date();
    const startMs = startTime ? new Date(startTime).getTime() : endTime.getTime();
    const timeTaken = Math.max(1, Math.floor((endTime.getTime() - startMs) / 1000));

    const attempt = {
      id: `attempt_${Date.now()}`,
      assignment_id: assignment.id,
      student_field: assignment.student_field,
      started_at: (startTime || endTime).toISOString(),
      completed_at: endTime.toISOString(),
      time_taken_seconds: timeTaken,
      user_answers: userAnswers,
      user_explanations: userExplanations,
      questions: assignment.questions,
      auto_submitted: autoSubmit
    };

    setIsSubmitted(true);
    setIsAssessmentActive(false);
    onComplete(attempt);
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[440px]">
        <div className="bg-slate-950/75 backdrop-blur-2xl border border-white/15 rounded-2xl p-8 text-center space-y-6 max-w-md w-full shadow-2xl">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-orange-500 mx-auto"></div>

          <div className="space-y-2">
            <div className="text-xl font-bold text-white">Generating Your Assignment</div>
            <div className="text-sm text-white/75">{loadingMessage || 'Preparing AI-powered questions...'}</div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${Math.max(5, loadingProgress)}%` }}
              ></div>
            </div>
            <div className="text-xs text-orange-400 font-semibold tabular-nums">
              {loadingProgress > 0 ? `${Math.round(loadingProgress)}% Complete` : 'Starting...'}
            </div>
          </div>

          <div className="space-y-1.5 text-xs sm:text-sm text-white/60 bg-slate-900/70 border border-white/10 rounded-xl p-3.5 text-left">
            <div>🎯 Analyzing your study field and background</div>
            <div>🤖 Generating live AI assessment questions</div>
            <div>⚡ Streaming real-time question progress</div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left">
            <div className="text-xs text-blue-300 leading-relaxed">
              💡 <strong>Personalized Assessment:</strong> We're selecting questions from our
              comprehensive question banks that match your study field and academic level.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="bg-slate-950/75 backdrop-blur-2xl border border-white/15 rounded-2xl p-8 text-center space-y-5 max-w-md w-full shadow-2xl">
          <AlertCircle className="h-14 w-14 text-red-400 mx-auto" />
          <div className="space-y-2.5">
            <h2 className="text-xl font-bold text-white">Assignment Generation Failed</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              We couldn't generate your field-based assessment. This could be due to:
            </p>
            <ul className="text-left text-xs sm:text-sm text-white/60 space-y-1 bg-slate-900/70 border border-white/10 rounded-xl p-3.5">
              <li>• Network connectivity issues</li>
              <li>• Unable to load student profile</li>
              <li>• Question bank temporarily unavailable</li>
            </ul>
          </div>
          <div className="space-y-3 pt-1">
            <button
              onClick={loadAssignment}
              className="btn bg-orange-500 hover:bg-orange-600 text-white text-sm w-full justify-center"
            >
              Try Again
            </button>
            <div className="text-xs text-white/50">
              If the problem persists, please contact support
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = assignment.questions[currentQuestionIndex] ?? assignment.questions.find(Boolean);
  const answeredQuestions = new Set(
    assignment.questions
      .map((q, index) => (q && q.id && userAnswers[q.id] ? index : null))
      .filter(index => index !== null)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">{assignment.title}</h1>
        <p className="text-sm sm:text-base text-white/65 break-words">{assignment.description}</p>
      </div>

      {/* Timer and Progress */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="w-full">
          <Timer timeRemaining={timeRemaining} totalTime={ASSIGNMENT_CONFIG.TIME_LIMIT_MINUTES * 60} />
        </div>
        <div className="w-full">
          <ProgressIndicator
            currentQuestion={currentQuestionIndex}
            totalQuestions={assignment.questions.length}
            answeredQuestions={answeredQuestions}
          />
        </div>
      </div>

      {/* Current Question */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={assignment.questions.length}
        userAnswer={currentQuestion ? userAnswers[currentQuestion.id] : undefined}
        userExplanation={currentQuestion ? userExplanations[currentQuestion.id] : undefined}
        onAnswerChange={handleAnswerChange}
        onExplanationChange={handleExplanationChange}
        categories={categories}
      />

      {/* Navigation */}
      <div className="bg-slate-950/65 backdrop-blur-xl border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 sm:justify-between shadow-lg">
        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl border border-white/15 transition-colors"
        >
          Previous
        </button>

        <div className="flex flex-wrap justify-center items-center gap-1.5 max-w-full">
          {assignment.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => navigateToQuestion(index)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold tabular-nums transition-all flex-shrink-0 ${
                index === currentQuestionIndex
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : answeredQuestions.has(index)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 hover:bg-emerald-500/30'
                  : 'bg-slate-900/80 text-white/65 border border-white/10 hover:bg-white/10'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === assignment.questions.length - 1 ? (
          <button
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-600/20"
          >
            Submit Assignment
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
          >
            Next
          </button>
        )}
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Submit Assignment?</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              You have answered <strong className="text-white">{answeredQuestions.size}</strong> out of <strong className="text-white">{assignment.questions.length}</strong> questions. 
              Are you sure you want to submit your assignment?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl border border-white/15 transition-colors"
              >
                Continue Working
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
