import React, { useState, useEffect } from 'react';
import { 
  Bot, Sparkles, Cpu, Zap, CheckCircle2, AlertCircle, Save, 
  RefreshCw, Sliders, BookOpen, Layers, Plus, Trash2, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import ApiClient from '../lib/apiClient';

export default function AIModelConfig() {
  // Model Settings State
  const [provider, setProvider] = useState('uniguru_mitra');
  const [endpoint, setEndpoint] = useState('https://api.uniguru.ai/v1/chat/completions');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('uniguru-mitra-v1');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Connection Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Field of Study Question Generator State
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('Computer Science & Engineering');
  const [customField, setCustomField] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [topics, setTopics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
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
    loadSettings();
    loadFields();
  }, []);

  async function loadSettings() {
    try {
      const res = await ApiClient.get('/ai/settings');
      if (res && res.success && res.data) {
        const d = res.data;
        setAiEnabled(d.enabled !== false);
        setProvider(d.provider || 'uniguru_mitra');
        setModel(d.model || d.metadata?.uniguru_model || 'uniguru-mitra-v1');
        if (d.metadata?.uniguru_endpoint) {
          setEndpoint(d.metadata.uniguru_endpoint);
        }
        if (d.metadata?.uniguru_api_key) {
          setApiKey(d.metadata.uniguru_api_key);
        }
      }
    } catch (err) {
      console.warn('Could not load AI settings:', err.message);
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

  async function handleSaveSettings() {
    setIsSavingSettings(true);
    try {
      await ApiClient.put('/ai/settings', {
        enabled: aiEnabled,
        provider,
        model,
        metadata: {
          uniguru_endpoint: endpoint,
          uniguru_api_key: apiKey,
          uniguru_model: model,
          last_updated: new Date().toISOString()
        }
      });
      toast.success('AI configuration saved successfully');
    } catch (err) {
      toast.error('Failed to save settings: ' + (err.message || ''));
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setTestResult(null);
    try {
      // First save active settings so backend uses current values
      await ApiClient.put('/ai/settings', {
        enabled: aiEnabled,
        provider,
        model,
        metadata: {
          uniguru_endpoint: endpoint,
          uniguru_api_key: apiKey,
          uniguru_model: model
        }
      });

      const res = await ApiClient.post('/ai/test-connection', {});
      if (res && res.success) {
        setTestResult({
          status: 'success',
          message: res.message || 'Model verified and active.'
        });
        toast.success('Connection verified!');
      } else {
        setTestResult({
          status: 'error',
          message: res.error || 'Connection failed'
        });
        toast.error('Connection failed');
      }
    } catch (err) {
      setTestResult({
        status: 'error',
        message: err.message || 'Connection failed'
      });
      toast.error('Connection error: ' + (err.message || ''));
    } finally {
      setIsTesting(false);
    }
  }

  async function handleGenerateQuestions() {
    const activeField = customField.trim() || selectedField;
    if (!activeField) {
      toast.error('Please select or specify a field of study');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading(`Generating questions for ${activeField} via ${provider === 'uniguru_mitra' ? 'Uniguru / Mitra' : 'Groq'}...`);
    try {
      const parsedTopics = topics
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await ApiClient.post('/ai/generate-questions', {
        field_of_study: activeField,
        difficulty,
        count: Number(questionCount),
        topics: parsedTopics
      });

      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setGeneratedQuestions(res.data);
        toast.success(`Generated ${res.data.length} questions tailored to ${activeField}!`, { id: toastId });
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
      let savedCount = 0;
      for (const q of generatedQuestions) {
        await ApiClient.post('/questions', {
          question_id: q.question_id || `q_${Date.now()}_${savedCount}`,
          category: q.category || selectedField,
          difficulty: q.difficulty || difficulty,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || '',
          vedic_connection: q.vedic_connection || '',
          modern_application: q.modern_application || '',
          target_domains: q.target_domains || [selectedField.toLowerCase().replace(/[^a-z0-9]/g, '_')],
          is_active: true,
          created_by: 'uniguru_mitra'
        });
        savedCount++;
      }
      toast.success(`Successfully saved ${savedCount} questions into Question Bank!`, { id: toastId });
      setGeneratedQuestions([]);
    } catch (err) {
      toast.error('Failed to save some questions: ' + (err.message || ''), { id: toastId });
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
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-black/40 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Uniguru / Mitra AI Integration
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Curriculum Engine
                </span>
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                Link organization language models (Uniguru/Mitra) to generate and evaluate questions strictly aligned with each student's field of study.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingSettings ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Configuration */}
        <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Sliders className="w-5 h-5 text-orange-400" />
              <span>Model Provider</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <span className="text-white/70">{aiEnabled ? 'Enabled' : 'Disabled'}</span>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </label>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider text-white/60 font-medium">
              Active Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('uniguru_mitra')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'uniguru_mitra'
                    ? 'border-orange-500 bg-orange-500/15 text-white font-semibold ring-1 ring-orange-500'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">Uniguru / Mitra</span>
                </div>
                <p className="text-[11px] text-white/50 mt-1">Dedicated org model</p>
              </button>

              <button
                type="button"
                onClick={() => setProvider('groq')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'groq'
                    ? 'border-orange-500 bg-orange-500/15 text-white font-semibold ring-1 ring-orange-500'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">Groq LLM</span>
                </div>
                <p className="text-[11px] text-white/50 mt-1">High-speed fallback</p>
              </button>
            </div>
          </div>

          {/* Uniguru / Mitra Settings */}
          {provider === 'uniguru_mitra' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Uniguru / Mitra API Endpoint
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.uniguru.ai/v1/chat/completions"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-white/40 mt-1">
                  Custom gateway or internal LLM host
                </p>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  API Key / Auth Token (Optional if internal)
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="mitra-sk-..."
                    className="w-full px-3 py-2 pr-10 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-2.5 text-white/40 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="uniguru-mitra-v1"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {provider === 'groq' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs text-white/70 mb-1 font-medium">
                  Groq Model Identifier
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="llama-3.3-70b-versatile"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* Test Connection Button */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 text-orange-400 ${isTesting ? 'animate-bounce' : ''}`} />
              {isTesting ? 'Testing Connectivity...' : 'Test Connection'}
            </button>

            {testResult && (
              <div className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.status === 'success' 
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}>
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Field of Study Generator & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Generation Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
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

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating Questions...' : 'Generate Questions with Uniguru/Mitra'}
              </button>
            </div>
          </div>

          {/* Generated Questions List / Preview */}
          {generatedQuestions.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-semibold text-white text-base">
                    Generated Questions ({generatedQuestions.length})
                  </h3>
                  <p className="text-xs text-white/60">
                    Review and commit directly to the live MongoDB Question Bank
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGeneratedQuestions([])}
                    className="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveAllQuestions}
                    disabled={isSavingQuestions}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium text-xs transition-all shadow-md shadow-green-500/20 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingQuestions ? 'Saving...' : 'Import All to Question Bank'}
                  </button>
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
                        title="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm font-medium text-white">
                      {q.question_text}
                    </p>

                    {/* Options */}
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

                    {/* Vedic connection & Modern application */}
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
