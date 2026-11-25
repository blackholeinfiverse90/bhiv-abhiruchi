import React, { useState, useEffect } from 'react';
import {
  Bot, Sparkles, Zap, CheckCircle2, AlertCircle, Save,
  RefreshCw, ShieldCheck, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ApiClient from '../lib/apiClient';

export default function AIModelConfig() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Automatic Live Status State
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [statusInfo, setStatusInfo] = useState(null);

  // Field of Study Question Generator State
  const [fields, setFields] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedField, setSelectedField] = useState('Computer Science & Engineering');
  const [customField, setCustomField] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [topics, setTopics] = useState('');
  const [autoSaveToBank, setAutoSaveToBank] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generationMeta, setGenerationMeta] = useState(null);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  const defaultFields = [
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Mechanical Engineering',
    'Electrical & Electronics Engineering',
    'Civil & Structural Engineering',
    'Biotechnology & Life Sciences',
    'Vedic Mathematics & Ancient Indian Science',
    'Business Management & Analytics',
    'Language, Literature & Philosophy',
    'Applied Physics & Chemistry'
  ];

  useEffect(() => {
    initializeAIView();
    loadFields();
    loadCategories();
  }, []);

  async function initializeAIView() {
    try {
      const res = await ApiClient.get('/ai/settings');
      if (res && res.success && res.data) {
        setAiEnabled(res.data.enabled !== false);
      }
    } catch {
      // Continue with default enabled state
    }
    await checkLiveStatus(false);
  }

  async function checkLiveStatus(showToast = true) {
    setIsCheckingStatus(true);
    try {
      const res = await ApiClient.post('/ai/test-connection', {});
      if (res && res.success) {
        const isMitra = res.provider_used === 'mitra';
        setStatusInfo({
          status: isMitra ? 'mitra' : 'fallback',
          provider: res.provider_used || 'mitra',
          model: res.model_used || 'mitra-companion',
          message: isMitra
            ? 'MITRA AI is live and connected automatically.'
            : `MITRA temporarily unavailable — automatic Groq fallback active (${res.model_used}).`
        });
        if (showToast) {
          toast.success(isMitra ? 'MITRA AI is connected!' : 'Automatic Groq fallback is active');
        }
      } else {
        setStatusInfo({
          status: 'error',
          message: res?.error || 'AI engines unavailable'
        });
        if (showToast) toast.error('AI connection check failed');
      }
    } catch (err) {
      setStatusInfo({
        status: 'error',
        message: err.message || 'Could not reach backend AI service'
      });
      if (showToast) toast.error('Status check failed: ' + (err.message || ''));
    } finally {
      setIsCheckingStatus(false);
    }
  }

  async function handleToggleEnabled(nextEnabled) {
    setIsToggling(true);
    setAiEnabled(nextEnabled);
    try {
      await ApiClient.put('/ai/settings', { enabled: nextEnabled });
      toast.success(`MITRA AI ${nextEnabled ? 'enabled' : 'disabled'} for student assessments`);
    } catch (err) {
      setAiEnabled(!nextEnabled);
      toast.error('Failed to update AI toggle: ' + (err.message || ''));
    } finally {
      setIsToggling(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await ApiClient.get('/categories?type=question');
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setCategories(list.map(c => c.name).filter(Boolean));
      }
    } catch {
      // Ignore optional category load errors
    }
  }

  async function loadFields() {
    try {
      const res = await ApiClient.get('/fields');
      const list = res?.data || res?.fields || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        const fieldNames = list.map(f => f.name || f.field_name || f.id).filter(Boolean);
        setFields(Array.from(new Set([...defaultFields, ...fieldNames])));
      } else {
        setFields(defaultFields);
      }
    } catch {
      setFields(defaultFields);
    }
  }

  async function handleGenerateQuestions() {
    const activeField = customField.trim() || selectedField;
    if (!activeField) {
      toast.error('Please select or specify a field of study');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading(`Generating ${questionCount} questions for ${activeField} via MITRA...`);
    try {
      const parsedTopics = topics
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await ApiClient.post('/ai/generate-questions', {
        field_of_study: activeField,
        category: selectedCategory || activeField,
        difficulty,
        count: Number(questionCount),
        topics: parsedTopics,
        saveToBank: autoSaveToBank
      });

      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setGeneratedQuestions(res.data);
        setGenerationMeta({
          provider: res.provider_used,
          model: res.model_used,
          field: activeField,
          savedToBank: Boolean(res.saved_to_bank)
        });
        toast.success(
          res.saved_to_bank
            ? `Generated & auto-saved ${res.data.length} questions to Question Bank!`
            : `Generated ${res.data.length} questions tailored to ${activeField}!`,
          { id: toastId }
        );
      } else {
        throw new Error(res?.error || 'No questions returned');
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Generation failed: ' + (err.message || ''), { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveAllQuestions() {
    if (generatedQuestions.length === 0) return;
    setIsSavingQuestions(true);
    const toastId = toast.loading(`Saving ${generatedQuestions.length} questions to MongoDB...`);
    try {
      const activeField = customField.trim() || selectedField;
      const payload = generatedQuestions.map((q, idx) => ({
        question_id: q.question_id || `q_${Date.now()}_${idx}`,
        category: selectedCategory || q.category || activeField,
        difficulty: q.difficulty || difficulty,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        vedic_connection: q.vedic_connection || '',
        modern_application: q.modern_application || '',
        target_domains: q.target_domains || [activeField.toLowerCase().replace(/[^a-z0-9]/g, '_')],
        is_active: true,
        is_ai_generated: true,
        created_by: q.created_by || 'mitra'
      }));
      const res = await ApiClient.post('/questions', payload);
      const savedCount = res?.count || payload.length;
      toast.success(`Saved ${savedCount} questions into Question Bank!`, { id: toastId });
      setGeneratedQuestions([]);
      setGenerationMeta(null);
    } catch (err) {
      toast.error('Failed to save questions: ' + (err.message || ''), { id: toastId });
    } finally {
      setIsSavingQuestions(false);
    }
  }

  function handleRemoveQuestion(idx) {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-8 text-white">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-slate-950/75 bg-gradient-to-r from-orange-950/50 via-amber-950/25 to-slate-950/80 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                MITRA AI
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Automated Curriculum Engine
                </span>
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                Fully automated MITRA integration for field-of-study questions, response evaluation, and student feedback (with seamless Groq fallback if unavailable).
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/15 bg-black/30 cursor-pointer text-sm">
            <span className="text-white/80 font-medium">
              AI Questions: {aiEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <input
              type="checkbox"
              disabled={isToggling}
              checked={aiEnabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Automated MITRA Engine Status */}
        <div className="lg:col-span-1 rounded-2xl border border-white/15 bg-slate-950/65 p-6 backdrop-blur-xl space-y-5 h-fit shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              <span>Active Engine</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
              Zero-Config Auto
            </span>
          </div>

          <div className="p-4 rounded-xl border border-orange-500/40 bg-orange-500/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-white text-base">MITRA</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 text-orange-200 border border-orange-500/20">
                mitra-companion
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Primary AI model connected automatically with JWT guest authentication. Automatically falls back to Groq LLM if MITRA is unreachable.
            </p>
          </div>

          {/* Live Health Indicator */}
          <div className="space-y-3">
            {isCheckingStatus ? (
              <div className="p-3 rounded-xl border border-white/10 bg-black/30 text-xs text-white/70 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                <span>Checking live MITRA connectivity...</span>
              </div>
            ) : statusInfo && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                statusInfo.status === 'mitra'
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : statusInfo.status === 'fallback'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}>
                {statusInfo.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400 mt-0.5" />
                )}
                <span>{statusInfo.message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => checkLiveStatus(true)}
              disabled={isCheckingStatus}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 text-orange-400 ${isCheckingStatus ? 'animate-pulse' : ''}`} />
              {isCheckingStatus ? 'Checking...' : 'Check Live Status'}
            </button>
          </div>
        </div>

        {/* Right Columns: Field of Study Generator & Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/15 bg-slate-950/65 p-6 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-white font-semibold">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span>Ask Curriculum-Aligned Questions by Field of Study</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Field of Study
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                >
                  {fields.map(f => (
                    <option key={f} value={f} className="bg-neutral-900 text-white">
                      {f}
                    </option>
                  ))}
                  <option value="Custom" className="bg-neutral-900 text-orange-300">
                    + Other / Custom Field...
                  </option>
                </select>
              </div>

              {selectedField === 'Custom' && (
                <div>
                  <label className="block text-xs text-white/70 mb-1 font-medium">
                    Enter Custom Field Name
                  </label>
                  <input
                    type="text"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    placeholder="e.g. Nanotechnology, Robotics..."
                    className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="easy" className="bg-neutral-900 text-white">Easy (Foundational)</option>
                  <option value="medium" className="bg-neutral-900 text-white">Medium (Practical / Applied)</option>
                  <option value="hard" className="bg-neutral-900 text-white">Hard (Advanced / Systems)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="1" className="bg-neutral-900 text-white">1 Question</option>
                  <option value="3" className="bg-neutral-900 text-white">3 Questions</option>
                  <option value="5" className="bg-neutral-900 text-white">5 Questions</option>
                  <option value="10" className="bg-neutral-900 text-white">10 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Target Question Category (Optional)
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="" className="bg-neutral-900 text-white">Auto (Match Field of Study)</option>
                  {categories.map(c => (
                    <option key={c} value={c} className="bg-neutral-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Specific Topics / Keywords (Optional)
                </label>
                <input
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g. Binary trees, Dynamic memory, Thermodynamics..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSaveToBank}
                  onChange={(e) => setAutoSaveToBank(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
                Auto-save generated questions to Question Bank
              </label>
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating with MITRA...' : 'Generate Questions with MITRA'}
              </button>
            </div>
          </div>

          {/* Generated Questions Preview */}
          {generatedQuestions.length > 0 && (
            <div className="rounded-2xl border border-white/15 bg-slate-950/65 p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-semibold text-white text-base flex items-center gap-2 flex-wrap">
                    Generated Questions ({generatedQuestions.length})
                    {generationMeta?.provider && (
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {generationMeta.provider === 'mitra' ? 'MITRA' : `Fallback: ${generationMeta.provider}`} · {generationMeta.model}
                      </span>
                    )}
                    {generationMeta?.savedToBank && (
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                        ✓ Auto-Saved to Bank
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-white/60">
                    {generationMeta?.savedToBank
                      ? 'Already saved to MongoDB Question Bank.'
                      : 'Review and commit directly to the live MongoDB Question Bank'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setGeneratedQuestions([]); setGenerationMeta(null); }}
                    className="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                  {!generationMeta?.savedToBank && (
                    <button
                      onClick={handleSaveAllQuestions}
                      disabled={isSavingQuestions}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium text-xs transition-all shadow-md shadow-green-500/20 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSavingQuestions ? 'Saving...' : 'Import All to Question Bank'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">
                          {q.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-semibold ${
                          q.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                          q.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-white/40 hover:text-red-400 p-1 transition-colors"
                        title="Remove from preview"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm font-medium text-white">
                      {q.question_text}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt, oIdx) => {
                        const isCorrect = opt === q.correct_answer || opt.startsWith(q.correct_answer);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-lg border ${
                              isCorrect
                                ? 'border-green-500/50 bg-green-500/10 text-green-200 font-medium'
                                : 'border-white/10 bg-white/5 text-white/70'
                            }`}
                          >
                            {opt} {isCorrect && '✓'}
                          </div>
                        );
                      })}
                    </div>

                    {(q.vedic_connection || q.modern_application) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                        {q.vedic_connection && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">
                            <span className="font-semibold block mb-0.5">Vedic Connection:</span>
                            {q.vedic_connection}
                          </div>
                        )}
                        {q.modern_application && (
                          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-200">
                            <span className="font-semibold block mb-0.5">Modern Industry Application:</span>
                            {q.modern_application}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
