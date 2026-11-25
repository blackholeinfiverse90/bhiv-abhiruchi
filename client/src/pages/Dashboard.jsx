import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ApiClient from '../lib/apiClient'
import { 
  BookOpen, Brain, Clock, Star, Target, Trophy, BarChart3, Users, TrendingUp,
  Calendar, ChevronRight, Award, Activity, Zap, BookMarked, TrendingDown,
  CheckCircle, XCircle, ArrowRight, PlayCircle, PieChart, LineChart,
  Map, Compass, Lightbulb, Timer, Medal, GraduationCap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from "../lib/i18n";
import { toast } from 'react-hot-toast'
import { fieldBasedQuestionService } from '../lib/fieldBasedQuestionService'

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useI18n();
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    recentAttempts: [],
    stats: null,
    streaks: null,
    achievements: [],
    recommendations: []
  });
  const [hasCompletedIntake, setHasCompletedIntake] = useState(false);

  useEffect(() => {
    if (user) {
      const userId = user.id || user._id;
      const hasLocalIntake = Boolean(
        user.candidate_id ||
        user.institute_code ||
        user.has_completed_intake ||
        (user.intake_data && Object.keys(user.intake_data).length > 0) ||
        localStorage.getItem('gurukul_intake_' + userId)
      );
      if (hasLocalIntake) setHasCompletedIntake(true);
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const userId = user?.id || user?._id
      console.log('📊 Loading dashboard data for:', userId)

      let attemptsData = []

      // 1. Try MERN Express API
      try {
        const res = await ApiClient.get(`/students/profile/${userId}`)
        const studentProfile = res?.data
        const profileComplete = Boolean(
          studentProfile &&
          (studentProfile.candidate_id ||
           studentProfile.institute_code ||
           (studentProfile.intake_data && Object.keys(studentProfile.intake_data).length > 0))
        );
        if (profileComplete) {
          setHasCompletedIntake(true);
          // Silently pre-generate MITRA questions in background so Assignment loads in < 1s
          fieldBasedQuestionService.prewarmForStudent({
            ...studentProfile,
            user_id: userId,
          }).catch(() => {});
        } else if (user?.email) {
          try {
            const listRes = await ApiClient.get('/students');
            const studentsList = Array.isArray(listRes?.data) ? listRes.data : (listRes?.students || []);
            const match = studentsList.find((s) => (s.email || '').trim().toLowerCase() === user.email.trim().toLowerCase());
            if (match && (match.candidate_id || match.student_id)) {
              setHasCompletedIntake(true);
            }
          } catch (_) {}
        }
        if (studentProfile && Array.isArray(studentProfile.assessment_history) && studentProfile.assessment_history.length > 0) {
          attemptsData = studentProfile.assessment_history.map((ah, idx) => ({
            id: ah._id || `att_${idx}_${Date.now()}`,
            user_id: userId,
            percentage: ah.results?.percentage ?? Math.round(((ah.score || 0) / (((ah.total_questions || 10) * 10))) * 100),
            grade: ah.results?.grade || 'C',
            total_questions: ah.total_questions || 10,
            time_taken_seconds: ah.results?.time_taken_seconds || 120,
            created_at: ah.completed_at || new Date().toISOString()
          })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
      } catch (err) {
        console.warn('ApiClient /students/profile fetch failed, checking Supabase fallback:', err.message)
      }

      // 2. Fallback to Supabase if MERN API returned empty
      if (attemptsData.length === 0) {
        const { data: sbData, error: attemptsError } = await supabase
          .from('assignment_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!attemptsError && sbData) {
          attemptsData = sbData
        }
      }

      // Calculate comprehensive statistics
      if (attemptsData && attemptsData.length > 0) {
        const stats = calculateStats(attemptsData)
        const streaks = calculateStreaks(attemptsData)
        const achievements = calculateAchievements(attemptsData)
        const recommendations = generateRecommendations(attemptsData)
        
        setDashboardData({
          recentAttempts: attemptsData,
          stats,
          streaks,
          achievements,
          recommendations
        })
      }

      console.log('✅ Dashboard data loaded successfully')

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error(t('dashboard.loading') || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (attempts) => {
    const totalAttempts = attempts.length
    const averageScore = attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts
    const bestScore = Math.max(...attempts.map(attempt => attempt.percentage))
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.time_taken_seconds, 0)
    const improvement = attempts.length >= 2 ? attempts[0].percentage - attempts[attempts.length - 1].percentage : 0
    
    const gradeDistribution = attempts.reduce((dist, attempt) => {
      dist[attempt.grade] = (dist[attempt.grade] || 0) + 1
      return dist
    }, {})

    return {
      totalAttempts,
      averageScore,
      bestScore,
      totalTimeSpent,
      improvement,
      gradeDistribution
    }
  }

  const calculateStreaks = (attempts) => {
    let currentStreak = 0
    let longestStreak = 0
    
    // Calculate current streak (consecutive days with attempts)
    const today = new Date()
    const daysSinceLastAttempt = Math.floor((today - new Date(attempts[0]?.created_at)) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastAttempt <= 1) {
      currentStreak = 1
      // Count consecutive days
      for (let i = 1; i < attempts.length; i++) {
        const daysDiff = Math.floor((new Date(attempts[i-1].created_at) - new Date(attempts[i].created_at)) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) }
  }

  const calculateAchievements = (attempts) => {
    const achievements = []
    const stats = calculateStats(attempts)

    if (stats.totalAttempts >= 1) achievements.push({ icon: Medal, title: 'First Steps', description: 'Completed your first assessment', color: 'text-green-400' })
    if (stats.totalAttempts >= 5) achievements.push({ icon: Trophy, title: 'Dedicated Learner', description: 'Completed 5 assessments', color: 'text-yellow-400' })
    if (stats.bestScore >= 90) achievements.push({ icon: Star, title: 'Excellence', description: 'Scored 90% or higher', color: 'text-purple-400' })
    if (stats.averageScore >= 80) achievements.push({ icon: Award, title: 'Consistent Performer', description: 'Average score above 80%', color: 'text-blue-400' })
    if (stats.improvement > 20) achievements.push({ icon: TrendingUp, title: 'Rising Star', description: 'Improved by 20+ points', color: 'text-orange-400' })

    return achievements.slice(0, 3)
  }

  const generateRecommendations = (attempts) => {
    const recommendations = []
    const stats = calculateStats(attempts)
    const latestAttempt = attempts[0]

    if (stats.averageScore < 70) {
      recommendations.push({
        icon: BookOpen,
        title: 'Focus on Fundamentals',
        description: 'Review basic concepts to strengthen your foundation',
        action: 'Take Assessment',
        link: '/assignment',
        color: 'bg-blue-500/20 border-blue-400/30'
      })
    }

    if (latestAttempt && latestAttempt.percentage >= 80) {
      recommendations.push({
        icon: Zap,
        title: 'Advanced Challenge',
        description: 'You\'re ready for more complex assessments',
        action: 'Take Advanced Test',
        link: '/assignment',
        color: 'bg-purple-500/20 border-purple-400/30'
      })
    }

    if (stats.totalAttempts < 3) {
      recommendations.push({
        icon: Target,
        title: 'Build Momentum',
        description: 'Take more assessments to track your progress',
        action: 'Take Assessment',
        link: '/assignment',
        color: 'bg-orange-500/20 border-orange-400/30'
      })
    }

    return recommendations.slice(0, 2)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-400 bg-green-500/20'
      case 'B': return 'text-blue-400 bg-blue-500/20'
      case 'C': return 'text-orange-400 bg-orange-500/20'
      case 'D': return 'text-yellow-400 bg-yellow-500/20'
      case 'F': return 'text-red-400 bg-red-500/20'
      default: return 'text-white bg-white/20'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-5">
        {/* Student Tier Highlight */}
        {dashboardData.recentAttempts.length > 0 && (
          <div className="flex justify-center">
            <div className="bg-slate-950/75 backdrop-blur-xl rounded-2xl border border-orange-500/30 px-6 py-4 shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-xl bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-2xl shrink-0">
                  {dashboardData.stats.averageScore >= 90 ? '☁️' : dashboardData.stats.averageScore >= 75 ? '🌳' : '🌱'}
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-white">
                    {dashboardData.stats.averageScore >= 90 ? 'Sky Level (Akash)' : 
                     dashboardData.stats.averageScore >= 75 ? 'Tree Level (Vriksha)' : 
                     'Seed Level (Beej)'}
                  </div>
                  <div className="text-xs sm:text-sm text-orange-200/80">
                    {dashboardData.stats.averageScore >= 90 ? 'Mastery Achieved • Wisdom Synthesis' : 
                     dashboardData.stats.averageScore >= 75 ? 'Growing Strong • Skill Development' : 
                     'Foundation Building • Core Learning'}
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-white/10">
                  <div className="text-2xl font-bold text-orange-300 tabular-nums">{dashboardData.stats.averageScore.toFixed(1)}%</div>
                  <div className="text-xs text-white/50">{t('dashboard.currentLevel')}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {user ? 
              (dashboardData.recentAttempts.length > 0 ? 
                `Welcome back, ${user.full_name || 'Student'}!` : 
                `Welcome, ${user.full_name || 'Student'}!`
              ) : 
              'Gurukul Learning Analytics Hub'
            }
          </h1>
          {user?.email && hasCompletedIntake && (
            <div className="pt-1 flex justify-center">
              <a
                href={`${import.meta.env.VITE_PRAVESH_URL || "https://pravesh.blackholeinfiverse.com"}/login?email=${encodeURIComponent(user.email)}&auto=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:brightness-110 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-500/20 border border-white/20 transition-all"
                title={`Open Pravesh Launcher with ${user.email}`}
              >
                <Zap className="h-4 w-4" />
                <span>Open Pravesh Launcher ({user.email})</span>
                <ChevronRight className="h-4 w-4 opacity-80" />
              </a>
            </div>
          )}
          {user?.email && !hasCompletedIntake && !loading && (
            <div className="pt-1 flex justify-center">
              <Link
                to="/intake"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500/15 border border-orange-400/40 text-orange-200 hover:text-white hover:bg-orange-500/25 text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-orange-500/10"
              >
                <span>📝</span>
                <span>Complete Intake Form to Unlock Pravesh Launcher</span>
                <ChevronRight className="h-4 w-4 opacity-80" />
              </Link>
            </div>
          )}
          <p className="text-white/70 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            {loading ? 'Loading your comprehensive learning analytics...' : 
             dashboardData.recentAttempts.length > 0 ? 
             'Your comprehensive Gurukul learning analytics dashboard featuring real-time performance tracking across multiple domains.' :
             'Welcome to your personalized Gurukul learning analytics hub. This intelligent dashboard will unlock detailed performance insights once you complete your first assessment.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-white/60">
            {dashboardData.recentAttempts.length > 0 ? (
              <>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">📊 Real-time analytics</span>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">🎯 AI-powered insights</span>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">🏆 Achievement tracking</span>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">📈 Progress monitoring</span>
              </>
            ) : (
              <>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">🚀 AI-generated assessments</span>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">⚡ Instant evaluation</span>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">📊 Detailed analytics</span>
                <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10">🎯 Personalized learning paths</span>
              </>
            )}
          </div>
        </div>
      </div>

      {user ? (
        <>
          {loading ? (
            <div className="bg-slate-950/65 backdrop-blur-xl border border-white/15 rounded-2xl text-center py-16 max-w-md mx-auto shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <div className="text-white/75 text-base font-medium">Loading dashboard...</div>
            </div>
          ) : dashboardData.recentAttempts.length > 0 ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-950/65 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/15 hover:border-blue-400/40 transition-all shadow-xl">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Average Performance</span>
                    <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-400/25">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1 tabular-nums">{dashboardData.stats.averageScore.toFixed(1)}%</div>
                  <div className="text-white/50 text-xs leading-relaxed">Composite score across {dashboardData.stats.totalAttempts} assessments</div>
                </div>
                <div className="bg-slate-950/65 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/15 hover:border-emerald-400/40 transition-all shadow-xl">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Peak Achievement</span>
                    <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/25">
                      <Trophy className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1 tabular-nums">{dashboardData.stats.bestScore.toFixed(1)}%</div>
                  <div className="text-white/50 text-xs leading-relaxed">Your highest performance benchmark</div>
                </div>
                <div className="bg-slate-950/65 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/15 hover:border-purple-400/40 transition-all shadow-xl">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Learning Investment</span>
                    <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-400/25">
                      <Clock className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1 tabular-nums">{formatTime(dashboardData.stats.totalTimeSpent)}</div>
                  <div className="text-white/50 text-xs leading-relaxed">Total focused study time</div>
                </div>
                <div className="bg-slate-950/65 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/15 hover:border-orange-400/40 transition-all shadow-xl">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Consistency Streak</span>
                    <div className="p-2 rounded-lg bg-orange-500/15 border border-orange-400/25">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1 tabular-nums">{dashboardData.streaks?.currentStreak || 0}</div>
                  <div className="text-white/50 text-xs leading-relaxed">Consecutive days of learning</div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assessment History */}
                <div className="lg:col-span-2 bg-slate-950/65 backdrop-blur-xl rounded-2xl p-6 border border-white/15 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
                        <Activity className="h-5 w-5 text-blue-400" /> {t('dashboard.assessmentHistory')}
                      </h3>
                      <p className="text-white/55 text-xs sm:text-sm mt-1">{t('dashboard.assessmentHistoryDesc')}</p>
                    </div>
                    <Link to="/assignment" className="btn bg-orange-500 hover:bg-orange-600 text-white text-sm">
                      {t('dashboard.newAssessment')}
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.recentAttempts.slice(0, 3).map((attempt) => (
                      <div key={attempt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/70 border border-white/10 hover:border-white/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 ${getGradeColor(attempt.grade)} border border-current/30 shrink-0`}>
                            {t('dashboard.grade')} {attempt.grade}
                          </div>
                          <div>
                            <div className="text-base font-semibold text-white flex items-center gap-2 tabular-nums">
                              {attempt.percentage.toFixed(1)}%
                              {attempt.percentage >= 90 && <span className="text-sm">🏆</span>}
                              {attempt.percentage >= 80 && attempt.percentage < 90 && <span className="text-sm">⭐</span>}
                            </div>
                            <div className="text-white/55 text-xs sm:text-sm">
                              {attempt.total_questions} {t('dashboard.questions')} • {formatTime(attempt.time_taken_seconds)}
                            </div>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-white/85 text-sm font-medium">{formatDate(attempt.created_at)}</div>
                          <div className="text-white/50 text-xs mt-1 flex items-center sm:justify-end gap-1">
                            <Brain className="h-3 w-3 text-orange-400" />
                            {t('dashboard.aiEvaluated')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                  <div className="bg-slate-950/65 backdrop-blur-xl rounded-2xl p-6 border border-white/15 shadow-xl">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2.5 mb-4">
                      <Zap className="h-5 w-5 text-orange-400" /> {t('dashboard.quickActions')}
                    </h3>
                    <div className="space-y-3">
                      <Link to="/assignment" className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-400/30 hover:border-orange-400/60 hover:bg-orange-500/20 transition-all group">
                        <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-400/30">
                          <Target className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-semibold text-white">{t('dashboard.takeAssessment')}</div>
                          <div className="text-xs text-orange-200/75">{t('dashboard.aiPoweredEvaluation')}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <Link to="/intake" className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/70 border border-white/15 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all group">
                        <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-400/30">
                          <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-semibold text-white">{t('dashboard.editProfile')}</div>
                          <div className="text-xs text-white/60">{t('dashboard.updateInformation')}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* Achievements */}
                  {dashboardData.achievements.length > 0 && (
                    <div className="bg-slate-950/65 backdrop-blur-xl rounded-2xl p-6 border border-white/15 shadow-xl">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2.5 mb-4">
                        <Award className="h-5 w-5 text-yellow-400" /> {t('dashboard.achievements')}
                      </h3>
                      <div className="space-y-3">
                        {dashboardData.achievements.slice(0, 2).map((achievement, index) => (
                          <div key={index} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/10">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                              <achievement.icon className={`w-4 h-4 ${achievement.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-white">{achievement.title}</div>
                              <div className="text-xs text-white/60">{achievement.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gurukul Learning System */}
              <div className="bg-slate-950/65 backdrop-blur-xl rounded-2xl p-6 border border-white/15 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
                      <Map className="h-5 w-5 text-emerald-400" /> {t('dashboard.ancientGurukul')}
                    </h3>
                    <p className="text-white/55 text-xs sm:text-sm mt-1">{t('dashboard.ancientGurukulDesc')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                  <div className={`text-center p-5 rounded-xl border transition-all ${
                    dashboardData.stats.averageScore < 75 ? 
                    'bg-gradient-to-br from-amber-500/20 to-orange-500/15 border-amber-400/50 ring-1 ring-amber-400/30 shadow-lg' : 
                    'bg-slate-900/60 border-white/10 opacity-80'
                  }`}>
                    <div className="text-3xl mb-2.5">🌱</div>
                    <div className="text-base font-semibold text-white mb-1">Seed Level (Beej)</div>
                    <div className="text-xs sm:text-sm text-amber-200/85 mb-2">Foundation building • Core concepts</div>
                    <div className="text-xs text-white/55">Absorb fundamental knowledge across domains</div>
                  </div>
                  <div className={`text-center p-5 rounded-xl border transition-all ${
                    dashboardData.stats.averageScore >= 75 && dashboardData.stats.averageScore < 90 ? 
                    'bg-gradient-to-br from-emerald-500/20 to-green-500/15 border-emerald-400/50 ring-1 ring-emerald-400/30 shadow-lg' : 
                    'bg-slate-900/60 border-white/10 opacity-80'
                  }`}>
                    <div className="text-3xl mb-2.5">🌳</div>
                    <div className="text-base font-semibold text-white mb-1">Tree Level (Vriksha)</div>
                    <div className="text-xs sm:text-sm text-emerald-200/85 mb-2">Growth phase • Skill development</div>
                    <div className="text-xs text-white/55">Expanding branches of specialized knowledge</div>
                  </div>
                  <div className={`text-center p-5 rounded-xl border transition-all ${
                    dashboardData.stats.averageScore >= 90 ? 
                    'bg-gradient-to-br from-blue-500/20 to-cyan-500/15 border-blue-400/50 ring-1 ring-blue-400/30 shadow-lg' : 
                    'bg-slate-900/60 border-white/10 opacity-80'
                  }`}>
                    <div className="text-3xl mb-2.5">☁️</div>
                    <div className="text-base font-semibold text-white mb-1">Sky Level (Akash)</div>
                    <div className="text-xs sm:text-sm text-blue-200/85 mb-2">Mastery • Wisdom synthesis</div>
                    <div className="text-xs text-white/55">Boundless understanding across subjects</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // First-time user
            <div className="text-center py-8">
              <div className="bg-slate-950/75 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/15 shadow-2xl max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 text-center sm:text-left">
                  <div className="p-4 rounded-2xl bg-orange-500/15 border border-orange-400/30">
                    <Star className="h-10 w-10 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{t('dashboard.startYourJourney')}</h2>
                    <p className="text-orange-200/85 text-sm sm:text-base mt-1">{t('dashboard.takeYourFirstAssessment')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                    <BookOpen className="h-6 w-6 text-blue-400" />
                    <span className="text-xs sm:text-sm font-medium">10 Questions</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                    <Clock className="h-6 w-6 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-medium">30 Minutes</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                    <Brain className="h-6 w-6 text-purple-400" />
                    <span className="text-xs sm:text-sm font-medium">AI Generated</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                    <Trophy className="h-6 w-6 text-orange-400" />
                    <span className="text-xs sm:text-sm font-medium">AI Evaluation</span>
                  </div>
                </div>
                
                <Link to="/assignment" className="inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/25 text-base">
                  <PlayCircle className="h-5 w-5" />
                  {t('dashboard.takeYourFirstAssessmentCta')}
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        // Non-authenticated
        <div className="text-center py-8">
          <div className="bg-slate-950/75 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/15 shadow-2xl max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 text-center sm:text-left">
              <div className="p-4 rounded-2xl bg-orange-500/15 border border-orange-400/30">
                <Target className="h-10 w-10 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{t('dashboard.experienceGurukul')}</h2>
                <p className="text-orange-200/85 text-sm sm:text-base mt-1">{t('dashboard.aiPoweredAssessments')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                <BookOpen className="h-6 w-6 text-blue-400" />
                <span className="text-xs sm:text-sm font-medium">10 Questions</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                <Clock className="h-6 w-6 text-emerald-400" />
                <span className="text-xs sm:text-sm font-medium">30 Minutes</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                <Brain className="h-6 w-6 text-purple-400" />
                <span className="text-xs sm:text-sm font-medium">AI Generated</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-white/85">
                <Trophy className="h-6 w-6 text-orange-400" />
                <span className="text-xs sm:text-sm font-medium">AI Evaluation</span>
              </div>
            </div>
            
            <Link to="/assignment" className="inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/25 text-base">
              <Target className="h-5 w-5" />
              {t('dashboard.tryAssessmentNow')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}