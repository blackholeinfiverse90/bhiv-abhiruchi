import { useAuth } from '../context/AuthContext';
import {
    Award,
    BarChart3,
    BookOpen,
    Brain,
    Calendar,
    CheckCircle,
    Clock,
    Lightbulb,
    MessageSquare,
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    User,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { ASSIGNMENT_CATEGORIES } from '../data/assignment';

const COLOR_STYLES = {
  orange: {
    iconBg: 'bg-orange-500/15 border border-orange-400/25',
    iconText: 'text-orange-400',
    bar: 'bg-orange-500',
    text: 'text-orange-400'
  },
  green: {
    iconBg: 'bg-emerald-500/15 border border-emerald-400/25',
    iconText: 'text-emerald-400',
    bar: 'bg-emerald-500',
    text: 'text-emerald-400'
  },
  blue: {
    iconBg: 'bg-blue-500/15 border border-blue-400/25',
    iconText: 'text-blue-400',
    bar: 'bg-blue-500',
    text: 'text-blue-400'
  },
  purple: {
    iconBg: 'bg-purple-500/15 border border-purple-400/25',
    iconText: 'text-purple-400',
    bar: 'bg-purple-500',
    text: 'text-purple-400'
  },
  red: {
    iconBg: 'bg-red-500/15 border border-red-400/25',
    iconText: 'text-red-400',
    bar: 'bg-red-500',
    text: 'text-red-400'
  }
};

function ScoreCard({ title, score, maxScore, percentage, icon: Icon, color = 'orange' }) {
  const palette = COLOR_STYLES[color] || COLOR_STYLES.orange;

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/65 backdrop-blur-xl p-5 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${palette.iconBg}`}>
          <Icon className={`h-5 w-5 ${palette.iconText}`} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/65 tabular-nums">
            {score.toFixed(1)} / {maxScore} ({percentage.toFixed(1)}%)
          </div>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-2 rounded-full ${palette.bar} transition-all duration-1000`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function CategoryBreakdown({ categoryScores }) {
  return (
    <div className="bg-slate-950/65 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
        <BarChart3 className="h-5 w-5 text-orange-400" />
        Category Performance
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(categoryScores).map(([category, data]) => {
          if (data.count === 0) return null;
          
          const colorKey = data.percentage >= 80 ? 'green' : data.percentage >= 60 ? 'orange' : 'red';
          const palette = COLOR_STYLES[colorKey];
          
          return (
            <div key={category} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-white text-sm">{category}</span>
                <span className={`text-sm font-semibold tabular-nums ${palette.text}`}>
                  {data.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-white/60 mb-2.5 tabular-nums">
                {data.total.toFixed(1)} / {data.max} points ({data.count} questions)
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${palette.bar} transition-all duration-1000`}
                  style={{ width: `${Math.min(100, data.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StrengthsAndImprovements({ strengths, improvementAreas }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Strengths */}
      <div className="bg-slate-950/65 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Your Strengths
        </h3>
        {strengths.length > 0 ? (
          <div className="space-y-3">
            {strengths.map((strength, index) => (
              <div key={index} className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-sm text-emerald-300">{strength.category}</span>
                </div>
                <div className="text-xs sm:text-sm text-white/80 leading-relaxed">{strength.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/60 text-sm">
            Keep working to identify your strengths! Every expert was once a beginner.
          </div>
        )}
      </div>

      {/* Areas for Improvement */}
      <div className="bg-slate-950/65 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
          <TrendingDown className="h-5 w-5 text-orange-400" />
          Growth Opportunities
        </h3>
        {improvementAreas.length > 0 ? (
          <div className="space-y-3">
            {improvementAreas.map((area, index) => (
              <div key={index} className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-orange-400" />
                  <span className="font-semibold text-sm text-orange-300">{area.category}</span>
                </div>
                <div className="text-xs sm:text-sm text-white/80 mb-1.5 leading-relaxed">{area.description}</div>
                <div className="text-xs text-white/60">{area.suggestion}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/60 text-sm">
            Great job! You're performing well across all categories.
          </div>
        )}
      </div>
    </div>
  );
}

function DetailedQuestionReview({ evaluatedResponses, onToggleExpand }) {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  const toggleQuestion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  return (
    <div className="bg-slate-950/65 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
        <MessageSquare className="h-5 w-5 text-orange-400" />
        Detailed Question Review
      </h3>
      <div className="space-y-3">
        {evaluatedResponses.map((response, index) => {
          const isExpanded = expandedQuestions.has(response.question_id);
          const colorKey = response.total_score >= 8 ? 'green' : response.total_score >= 6 ? 'orange' : 'red';
          const palette = COLOR_STYLES[colorKey];
          
          return (
            <div key={response.question_id} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleQuestion(response.question_id)}
              >
                <div className="flex items-center gap-3">
                  {response.is_correct ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-white">Question {index + 1}</div>
                    <div className="text-xs text-white/60">{response.question_category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-semibold tabular-nums ${palette.text}`}>
                    {response.total_score.toFixed(1)}/10
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 text-sm">
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="text-center p-2.5 rounded-lg bg-slate-950/60 border border-white/10">
                      <div className="text-xs text-white/60">Accuracy</div>
                      <div className="text-base font-semibold text-white tabular-nums">{response.accuracy_score}/10</div>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-slate-950/60 border border-white/10">
                      <div className="text-xs text-white/60">Explanation</div>
                      <div className="text-base font-semibold text-white tabular-nums">{response.explanation_score}/10</div>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-slate-950/60 border border-white/10">
                      <div className="text-xs text-white/60">Reasoning</div>
                      <div className="text-base font-semibold text-white tabular-nums">{response.reasoning_score}/10</div>
                    </div>
                  </div>

                  {response.user_answer && (
                    <div>
                      <div className="text-xs font-semibold text-white/75 mb-1">Your Answer:</div>
                      <div className="text-sm text-white/75">{response.user_answer}</div>
                    </div>
                  )}

                  {response.user_explanation && (
                    <div>
                      <div className="text-xs font-semibold text-white/75 mb-1">Your Explanation:</div>
                      <div className="text-sm text-white/75">{response.user_explanation}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-white/75 mb-1">Correct Answer:</div>
                    <div className="text-sm text-emerald-400 font-medium">{response.correct_answer}</div>
                  </div>

                  {response.ai_feedback && (
                    <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                      <div className="text-xs font-semibold text-blue-400 mb-1">AI Feedback</div>
                      <div className="text-sm text-white/80 leading-relaxed">{response.ai_feedback}</div>
                    </div>
                  )}

                  {response.suggestions && (
                    <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3">
                      <div className="text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5" />
                        Suggestions
                      </div>
                      <div className="text-sm text-white/80 leading-relaxed">{response.suggestions}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AssignmentResults({ results, onRetakeAssignment, onBackToDashboard }) {
  const { user } = useAuth();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-orange-400';
      case 'D': return 'text-yellow-400';
      case 'F': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* User Information Header */}
      {user && (
        <div className="rounded-2xl border border-white/15 bg-slate-950/70 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-400/25 shrink-0">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {user.full_name || 'Student'}
                </h2>
                <div className="text-blue-300/90 text-xs sm:text-sm">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="sm:text-right space-y-1">
              <div className="flex items-center sm:justify-end gap-2 text-white/70 text-xs sm:text-sm">
                <Calendar className="h-4 w-4 text-white/50" />
                <span>Completed: {formatDate(results.evaluated_at)}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-2 text-white/70 text-xs sm:text-sm tabular-nums">
                <Clock className="h-4 w-4 text-white/50" />
                <span>Time Taken: {formatTime(results.time_taken_seconds ?? results.attempt?.time_taken_seconds ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="bg-slate-950/75 backdrop-blur-xl border border-white/15 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-2xl">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Trophy className="h-7 w-7 text-orange-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Assignment Results</h1>
          {user && (
            <div className="flex items-center gap-1.5 text-white/60 text-xs sm:text-sm px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <Award className="h-3.5 w-3.5 text-orange-400" />
              <span>for {user.full_name || 'Student'}</span>
            </div>
          )}
        </div>
        <div className={`text-5xl sm:text-6xl font-extrabold ${getGradeColor(results.grade)}`}>
          {results.grade}
        </div>
        <div className="text-lg sm:text-xl font-semibold text-white tabular-nums">
          {results.percentage.toFixed(1)}% <span className="text-white/60 font-normal">({results.total_score.toFixed(1)}/{results.max_score})</span>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <ScoreCard
          title="Overall Score"
          score={results.total_score}
          maxScore={results.max_score}
          percentage={results.percentage}
          icon={Target}
          color="orange"
        />
        <ScoreCard
          title="Correct Answers"
          score={results.evaluated_responses.filter(r => r.is_correct).length}
          maxScore={results.evaluated_responses.length}
          percentage={(results.evaluated_responses.filter(r => r.is_correct).length / results.evaluated_responses.length) * 100}
          icon={CheckCircle}
          color="green"
        />
        <ScoreCard
          title="Avg. Explanation"
          score={results.evaluated_responses.reduce((sum, r) => sum + r.explanation_score, 0) / results.evaluated_responses.length}
          maxScore={10}
          percentage={(results.evaluated_responses.reduce((sum, r) => sum + r.explanation_score, 0) / results.evaluated_responses.length / 10) * 100}
          icon={Brain}
          color="blue"
        />
        <ScoreCard
          title="Avg. Reasoning"
          score={results.evaluated_responses.reduce((sum, r) => sum + r.reasoning_score, 0) / results.evaluated_responses.length}
          maxScore={10}
          percentage={(results.evaluated_responses.reduce((sum, r) => sum + r.reasoning_score, 0) / results.evaluated_responses.length / 10) * 100}
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Overall Feedback */}
      {results.overall_feedback && (
        <div className="rounded-2xl border border-white/15 bg-slate-950/65 backdrop-blur-xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-orange-400" />
            AI Feedback
          </h3>
          <div className="text-sm sm:text-base text-white/80 leading-relaxed">{results.overall_feedback}</div>
        </div>
      )}

      {/* Category Breakdown */}
      <CategoryBreakdown categoryScores={results.category_scores} />

      {/* Strengths and Improvements */}
      <StrengthsAndImprovements 
        strengths={results.strengths} 
        improvementAreas={results.improvement_areas} 
      />

      {/* Detailed Question Review */}
      <DetailedQuestionReview evaluatedResponses={results.evaluated_responses} />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <button
          onClick={onRetakeAssignment}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-xl font-semibold transition-colors shadow-lg shadow-orange-500/20"
        >
          Retake Assignment
        </button>
        <button
          onClick={onBackToDashboard}
          className="px-6 py-3 bg-slate-950/75 hover:bg-slate-900 text-white text-sm font-medium rounded-xl border border-white/15 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
