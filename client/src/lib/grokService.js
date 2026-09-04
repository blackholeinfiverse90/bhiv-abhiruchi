// Grok API service for generating questions and evaluating responses

import {
  API_ERROR_MESSAGES,
  ASSIGNMENT_CONFIG,
  DIFFICULTY_LEVELS,
  GROK_PROMPTS,
  getDynamicCategoryDistribution
} from '../data/assignment.js';
import { DynamicQuestionCategoryService } from './dynamicQuestionCategoryService.js';

const GROK_API_BASE_URL = 'https://api.groq.com/openai/v1';
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;

class GrokService {
  constructor() {
    console.log('Environment variable check:', {
      hasApiKey: !!import.meta.env.VITE_GROK_API_KEY,
      apiKeyPrefix: import.meta.env.VITE_GROK_API_KEY ? import.meta.env.VITE_GROK_API_KEY.substring(0, 6) : 'missing'
    });
    this.apiKey = GROK_API_KEY;
    this.baseUrl = GROK_API_BASE_URL;
    this.lastRequestTime = 0;
    this.minDelayBetweenRequests = 3000; // 3 seconds minimum between requests
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelayBetweenRequests) {
      const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  async makeApiCallWithRetry(messages, maxTokens = 2000, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait for rate limiting before each attempt
        await this.waitForRateLimit();

        const result = await this.makeApiCall(messages, maxTokens);
        return result;
      } catch (error) {
        lastError = error;
        console.log(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

        // If it's a rate limit error, wait longer before retrying
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          const backoffDelay = Math.min(30000, 2000 * Math.pow(2, attempt - 1)); // Exponential backoff, max 30s
          console.log(`⏳ Rate limit hit, waiting ${backoffDelay}ms before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        } else if (attempt < maxRetries) {
          // For other errors, shorter delay
          const delay = 1000 * attempt;
          console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async makeApiCall(messages, maxTokens = 2000) {
    if (!this.apiKey || this.apiKey === 'your_grok_api_key_here') {
      throw new Error(API_ERROR_MESSAGES.API_KEY_MISSING);
    }

    const candidateModels = [
      'groq/compound-mini',
      'groq/compound',
      'qwen/qwen3.6-27b',
      'openai/gpt-oss-20b',
      import.meta.env.VITE_GROQ_MODEL
    ].filter(Boolean);

    let lastError = null;

    for (const model of candidateModels) {
      const requestBody = {
        model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      };

      console.log(`🔍 Groq API Request [Model: ${model}]:`, {
        url: `${this.baseUrl}/chat/completions`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey.substring(0, 10)}...`,
          'Content-Type': 'application/json',
        },
        body: requestBody
      });

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('📡 Groq API Response Status:', response.status, response.statusText);

        if (!response.ok) {
          let errorDetails = 'No error details available';
          try {
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData, null, 2);
            console.error('❌ Groq API Error Response:', errorData);
          } catch {
            const errorText = await response.text();
            errorDetails = errorText;
            console.error('❌ Groq API Error Text:', errorText);
          }

          // If model doesn't exist, is decommissioned, or rate-limited, try next candidate model!
          if (
            response.status === 404 ||
            response.status === 429 ||
            errorDetails.includes('model_not_found') ||
            errorDetails.includes('decommissioned') ||
            errorDetails.includes('rate_limit')
          ) {
            console.warn(`⚠️ Model [${model}] failed/rate-limited (${response.status}), trying next candidate model...`);
            lastError = new Error(`Model [${model}] failed: ${errorDetails}`);
            continue;
          }

          if (response.status === 400) {
            throw new Error(`Bad Request (400): ${errorDetails}`);
          } else if (response.status === 401) {
            throw new Error('Unauthorized (401): Invalid API key or authentication failed');
          } else if (response.status >= 500) {
            throw new Error(API_ERROR_MESSAGES.GENERATION_FAILED);
          } else {
            throw new Error(`API call failed (${response.status}): ${errorDetails}`);
          }
        }

        const data = await response.json();
        console.log(`✅ Groq API Success Response [Model: ${model}]:`, {
          choices: data.choices?.length || 0,
          usage: data.usage,
          model: data.model
        });

        const content = data.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Groq API response format is invalid');
        }

        return content;
      } catch (err) {
        lastError = err;
        if (
          err.message.includes('model_not_found') ||
          err.message.includes('decommissioned') ||
          err.message.includes('Rate limit') ||
          err.message.includes('429')
        ) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All Groq candidate models failed.');
  }

  cleanAndParseJson(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Response is empty or not text');
    }

    // 1. Remove markdown code block wrappers (```json ... ``` or ``` ...)
    let cleaned = text.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();

    // 2. Try direct JSON.parse first
    try {
      const direct = JSON.parse(cleaned);
      if (Array.isArray(direct)) return direct;
      if (direct && Array.isArray(direct.questions)) return direct.questions;
    } catch {
      // Continue to extraction strategies
    }

    // 3. Find the first '[' and last ']' to extract array candidate
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');

    if (startIdx !== -1 && endIdx > startIdx) {
      let candidate = cleaned.slice(startIdx, endIdx + 1);

      // Remove trailing commas before ] or } and normalize smart quotes
      candidate = candidate
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.warn('First JSON array parse attempt failed, trying object regex extraction:', err.message);
      }
    }

    // 4. Fallback: extract individual {...} JSON objects using regex
    const objectMatches = cleaned.match(/\{[\s\S]*?\}/g);
    if (objectMatches && objectMatches.length > 0) {
      const extractedObjs = [];
      for (const rawObj of objectMatches) {
        try {
          const sanitizedObj = rawObj
            .replace(/,\s*([\]}])/g, '$1')
            .replace(/[\u201C\u201D]/g, '"');
          const parsedObj = JSON.parse(sanitizedObj);
          if (parsedObj && (parsedObj.question_text || parsedObj.text || parsedObj.question)) {
            extractedObjs.push({
              question_text: parsedObj.question_text || parsedObj.text || parsedObj.question,
              options: Array.isArray(parsedObj.options) ? parsedObj.options : [],
              correct_answer: parsedObj.correct_answer || parsedObj.correctAnswer || parsedObj.answer || (Array.isArray(parsedObj.options) ? parsedObj.options[0] : ''),
              explanation: parsedObj.explanation || ''
            });
          }
        } catch {
          // Skip unparseable object snippets
        }
      }
      if (extractedObjs.length > 0) {
        return extractedObjs;
      }
    }

    throw new Error('Failed to parse valid JSON questions array from model output');
  }

  async generateQuestions(category, difficulty, count = 5) {
    const prompt = GROK_PROMPTS.GENERATE_QUESTIONS
      .replace('{count}', count)
      .replace('{category}', category)
      .replace('{difficulty}', difficulty);

    const messages = [
      {
        role: 'system',
        content: 'You are an expert educational content creator. IMPORTANT: You MUST respond ONLY with a raw valid JSON array of question objects. Do NOT include markdown formatting, backticks, or introductory text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      console.log(`🎯 Generating ${count} ${category} questions at ${difficulty} difficulty...`);
      const response = await this.makeApiCallWithRetry(messages, 3000);

      const questions = this.cleanAndParseJson(response);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format received from API');
      }

      console.log(`✅ Successfully generated ${questions.length} ${category} questions`);

      // Add metadata to each question
      return questions.map((q, index) => ({
        id: `${category.toLowerCase()}_${difficulty}_${Date.now()}_${index}`,
        category,
        difficulty,
        type: 'multiple_choice',
        question_text: q.question_text || q.text || q.question || '',
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer || q.correctAnswer || q.answer || (Array.isArray(q.options) ? q.options[0] : ''),
        explanation: q.explanation || '',
        vedic_connection: q.vedic_connection || '',
        modern_application: q.modern_application || '',
        points: 10,
        time_limit_seconds: 180
      }));
    } catch (error) {
      console.error('Failed to generate questions:', error);
      throw new Error(`Failed to generate ${category} questions: ${error.message}`);
    }
  }

  async generateUniqueQuestions(category, difficulty, count, usedQuestionTexts, maxRetries = 2) {
    const uniqueQuestions = [];
    let attempts = 0;

    console.log(`🎯 Generating ${count} unique ${category} ${difficulty} questions...`);

    while (uniqueQuestions.length < count && attempts < maxRetries) {
      attempts++;
      console.log(`📝 Attempt ${attempts}/${maxRetries} for ${category} ${difficulty} questions...`);

      try {
        // For rate limiting, generate exactly what we need rather than extra
        const requestCount = count;
        const generatedQuestions = await this.generateQuestions(category, difficulty, requestCount);

        // Filter out duplicates
        for (const question of generatedQuestions) {
          if (uniqueQuestions.length >= count) break;

          const questionKey = this.normalizeQuestionText(question.question_text);
          if (!usedQuestionTexts.has(questionKey)) {
            usedQuestionTexts.add(questionKey);
            uniqueQuestions.push(question);
            console.log(`✅ Added unique question ${uniqueQuestions.length}/${count} for ${category}`);
          } else {
            console.log(`⚠️ Skipped duplicate question for ${category}`);
          }
        }

        // If we have enough unique questions, break
        if (uniqueQuestions.length >= count) {
          console.log(`✅ Successfully generated ${uniqueQuestions.length} unique ${category} questions`);
          break;
        }

        // If we still don't have enough unique questions, retry with longer delay
        if (uniqueQuestions.length < count && attempts < maxRetries) {
          const waitTime = 2000 * attempts; // Progressive delay
          console.log(`⏳ Only got ${uniqueQuestions.length}/${count} unique questions, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed for ${category} ${difficulty}:`, error);

        // If it's a rate limit error, wait longer
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          const rateLimitWait = 5000 * attempts; // 5s, 10s, etc.
          console.log(`⏳ Rate limit error, waiting ${rateLimitWait}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, rateLimitWait));
        } else if (attempts < maxRetries) {
          const errorWait = 1000 * attempts;
          console.log(`⏳ Error occurred, waiting ${errorWait}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, errorWait));
        }

        if (attempts === maxRetries) {
          throw new Error(`Failed to generate unique questions for ${category} ${difficulty} after ${maxRetries} attempts: ${error.message}`);
        }
      }
    }

    if (uniqueQuestions.length < count) {
      console.warn(`⚠️ Could only generate ${uniqueQuestions.length} out of ${count} required unique questions for ${category} ${difficulty}`);
      // Return what we have rather than failing completely
      return uniqueQuestions;
    }

    return uniqueQuestions.slice(0, count);
  }

  normalizeQuestionText(text) {
    // Normalize question text for duplicate detection
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  async generateFullAssignment(progressCallback = null) {
    const allQuestions = [];
    const usedQuestionTexts = new Set(); // Track used questions to prevent duplicates
    
    try {
      console.log('🚀 Starting assignment generation with dynamic categories...');
      
      // Get dynamic category distribution
      const categoryDistribution = await getDynamicCategoryDistribution(ASSIGNMENT_CONFIG.TOTAL_QUESTIONS);
      const totalCategories = Object.keys(categoryDistribution).length;
      let completedCategories = 0;
      
      console.log(`📊 Will generate ${ASSIGNMENT_CONFIG.TOTAL_QUESTIONS} questions across ${totalCategories} dynamic categories:`, categoryDistribution);

      if (progressCallback) {
        progressCallback(`Starting generation of ${ASSIGNMENT_CONFIG.TOTAL_QUESTIONS} questions...`, 0);
      }

      // Generate questions for each category according to dynamic distribution
      for (const [category, count] of Object.entries(categoryDistribution)) {
        console.log(`\n📚 === Generating ${count} questions for ${category} ===`);

        if (progressCallback) {
          progressCallback(`Generating ${category} questions (${completedCategories + 1}/${totalCategories})...`,
                         (completedCategories / totalCategories) * 100);
        }

        // For 10 questions total, use simpler distribution
        // Most questions will be medium difficulty with some easy and hard
        let easyCount = 0;
        let mediumCount = count;
        let hardCount = 0;

        // Adjust distribution for categories with 2 questions
        if (count === 2) {
          mediumCount = 1;
          hardCount = 1;
        } else if (count === 1) {
          mediumCount = 1;
          hardCount = 0;
        }

        try {
          // Generate questions for each difficulty level with retry logic
          if (easyCount > 0) {
            console.log(`📝 Generating ${easyCount} easy ${category} questions...`);
            const easyQuestions = await this.generateUniqueQuestions(
              category, DIFFICULTY_LEVELS.EASY, easyCount, usedQuestionTexts
            );
            allQuestions.push(...easyQuestions);
          }

          if (mediumCount > 0) {
            console.log(`📝 Generating ${mediumCount} medium ${category} questions...`);
            const mediumQuestions = await this.generateUniqueQuestions(
              category, DIFFICULTY_LEVELS.MEDIUM, mediumCount, usedQuestionTexts
            );
            allQuestions.push(...mediumQuestions);
          }

          if (hardCount > 0) {
            console.log(`📝 Generating ${hardCount} hard ${category} questions...`);
            const hardQuestions = await this.generateUniqueQuestions(
              category, DIFFICULTY_LEVELS.HARD, hardCount, usedQuestionTexts
            );
            allQuestions.push(...hardQuestions);
          }

          completedCategories++;
          console.log(`✅ Completed ${category} (${completedCategories}/${totalCategories})`);

          // Add longer delay between categories to respect rate limits
          if (completedCategories < totalCategories) {
            const delayTime = 4000; // 4 seconds between categories
            console.log(`⏳ Waiting ${delayTime}ms before next category to respect rate limits...`);
            await new Promise(resolve => setTimeout(resolve, delayTime));
          }

        } catch (error) {
          console.error(`❌ Failed to generate questions for ${category}:`, error);

          // If it's a rate limit error, wait longer and continue with other categories
          if (error.message.includes('rate limit') || error.message.includes('429')) {
            console.log(`⏳ Rate limit hit for ${category}, waiting 10 seconds before continuing...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }

          // Continue with other categories rather than failing completely
          console.log(`⚠️ Skipping ${category} due to error, continuing with other categories...`);
          completedCategories++;
        }
      }

      console.log(`\n📊 Generated ${allQuestions.length} total questions`);

      // Allow for some flexibility in question count due to rate limiting
      if (allQuestions.length < ASSIGNMENT_CONFIG.TOTAL_QUESTIONS * 0.7) {
        throw new Error(`Generated too few questions: ${allQuestions.length} out of ${ASSIGNMENT_CONFIG.TOTAL_QUESTIONS} required`);
      }

      // Shuffle questions to randomize order
      const shuffledQuestions = this.shuffleArray(allQuestions);

      console.log('🎉 Assignment generation completed successfully with dynamic categories');

      if (progressCallback) {
        progressCallback('Assignment generation completed!', 100);
      }

      return {
        id: `assignment_${Date.now()}`,
        title: 'Multidisciplinary Assessment',
        description: 'A comprehensive assessment covering dynamic question categories based on current system configuration.',
        questions: shuffledQuestions.slice(0, ASSIGNMENT_CONFIG.TOTAL_QUESTIONS),
        time_limit_minutes: ASSIGNMENT_CONFIG.TIME_LIMIT_MINUTES,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('💥 Failed to generate full assignment:', error);
      
      // Fallback to hardcoded distribution if dynamic fails
      if (error.message.includes('dynamic category distribution')) {
        console.log('⚠️ Falling back to hardcoded category distribution...');
        return this.generateFullAssignmentFallback(progressCallback);
      }
      
      throw new Error(`Assignment generation failed: ${error.message}`);
    }
  }

  /**
   * Fallback method using hardcoded categories if dynamic system fails
   */
  async generateFullAssignmentFallback(progressCallback = null) {
    const allQuestions = [];
    const usedQuestionTexts = new Set();
    const totalCategories = Object.keys(ASSIGNMENT_CONFIG.CATEGORY_DISTRIBUTION).length;
    let completedCategories = 0;

    console.log('🔄 Using fallback category distribution...');

    // Use hardcoded distribution as fallback
    for (const [category, count] of Object.entries(ASSIGNMENT_CONFIG.CATEGORY_DISTRIBUTION)) {
      console.log(`\n📚 === Generating ${count} questions for ${category} (fallback) ===`);

      if (progressCallback) {
        progressCallback(`Generating ${category} questions (${completedCategories + 1}/${totalCategories})...`,
                       (completedCategories / totalCategories) * 100);
      }

      // Simplified difficulty distribution for fallback
      let mediumCount = count;
      let hardCount = 0;

      if (count === 2) {
        mediumCount = 1;
        hardCount = 1;
      } else if (count === 1) {
        mediumCount = 1;
        hardCount = 0;
      }

      try {
        if (mediumCount > 0) {
          const mediumQuestions = await this.generateUniqueQuestions(
            category, DIFFICULTY_LEVELS.MEDIUM, mediumCount, usedQuestionTexts
          );
          allQuestions.push(...mediumQuestions);
        }

        if (hardCount > 0) {
          const hardQuestions = await this.generateUniqueQuestions(
            category, DIFFICULTY_LEVELS.HARD, hardCount, usedQuestionTexts
          );
          allQuestions.push(...hardQuestions);
        }

        completedCategories++;
        console.log(`✅ Completed ${category} fallback (${completedCategories}/${totalCategories})`);

        if (completedCategories < totalCategories) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      } catch (error) {
        console.error(`❌ Failed to generate fallback questions for ${category}:`, error);
        completedCategories++;
      }
    }

    const shuffledQuestions = this.shuffleArray(allQuestions);

    return {
      id: `assignment_${Date.now()}`,
      title: 'Multidisciplinary Assessment (Fallback)',
      description: 'A comprehensive assessment using fallback category configuration.',
      questions: shuffledQuestions.slice(0, ASSIGNMENT_CONFIG.TOTAL_QUESTIONS),
      time_limit_minutes: ASSIGNMENT_CONFIG.TIME_LIMIT_MINUTES,
      created_at: new Date().toISOString()
    };
  }

  async evaluateResponse(question, userAnswer, userExplanation) {
    const prompt = GROK_PROMPTS.EVALUATE_RESPONSE
      .replace('{question}', question.question_text)
      .replace('{answer}', userAnswer)
      .replace('{explanation}', userExplanation || 'No explanation provided')
      .replace('{correct_answer}', question.correct_answer);

    const messages = [
      {
        role: 'system',
        content: 'You are an expert educational evaluator. Provide fair, constructive feedback that helps students learn and improve.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      console.log(`🔍 Evaluating response for question: ${question.question_text.substring(0, 50)}...`);
      console.log(`📝 User answer: "${userAnswer}"`);
      console.log(`📝 User explanation: "${userExplanation}"`);

      const response = await this.makeApiCallWithRetry(messages, 1000);

      console.log(`📄 Raw evaluation response:`, response);

      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      console.log(`🔍 JSON match result:`, jsonMatch ? 'Found' : 'Not found');

      if (!jsonMatch) {
        console.error(`❌ No JSON found in evaluation response. Full response:`, response);
        throw new Error('No JSON found in evaluation response');
      }

      console.log(`📋 Extracted JSON string:`, jsonMatch[0]);

      let evaluation;
      try {
        evaluation = JSON.parse(jsonMatch[0]);
        console.log(`✅ Parsed evaluation object:`, evaluation);
      } catch (parseError) {
        console.error(`❌ JSON parsing failed:`, parseError);
        console.error(`❌ Failed to parse JSON:`, jsonMatch[0]);
        throw new Error(`Failed to parse evaluation JSON: ${parseError.message}`);
      }

      // Validate evaluation structure
      console.log(`🔍 Validating evaluation structure...`);
      console.log(`- accuracy_score: ${evaluation.accuracy_score} (type: ${typeof evaluation.accuracy_score})`);
      console.log(`- explanation_score: ${evaluation.explanation_score} (type: ${typeof evaluation.explanation_score})`);
      console.log(`- reasoning_score: ${evaluation.reasoning_score} (type: ${typeof evaluation.reasoning_score})`);

      if (typeof evaluation.accuracy_score !== 'number' ||
          typeof evaluation.explanation_score !== 'number' ||
          typeof evaluation.reasoning_score !== 'number') {
        console.error(`❌ Invalid evaluation format:`, evaluation);
        throw new Error('Invalid evaluation format received from API');
      }

      console.log(`✅ Successfully evaluated response with scores: ${evaluation.accuracy_score}/${evaluation.explanation_score}/${evaluation.reasoning_score}`);
      return evaluation;
    } catch (error) {
      console.error('💥 Failed to evaluate response:', error);
      console.error('💥 Error stack:', error.stack);
      throw new Error(`Response evaluation failed: ${error.message}`);
    }
  }

  async generateOverallFeedback(evaluatedResponses, categoryScores, overallPercentage, userContext = null) {
    try {
      console.log('🎯 Generating overall feedback with Grok AI...');
      
      const totalQuestions = evaluatedResponses.length;
      const correctAnswers = evaluatedResponses.filter(r => r.is_correct).length;
      const totalScore = evaluatedResponses.reduce((sum, r) => sum + r.total_score, 0);
      const maxScore = totalQuestions * 10; // Assuming 10 points per question
      
      // Prepare category performance breakdown
      const categoryBreakdown = Object.entries(categoryScores)
        .map(([category, data]) => `${category}: ${data.percentage.toFixed(1)}% (${data.total}/${data.max} points)`)
        .join('\n');
      
      // Identify strong and weak categories
      const strongCategories = Object.entries(categoryScores)
        .filter(([, data]) => data.percentage >= 80)
        .map(([category]) => category)
        .join(', ') || 'None significantly above average';
      
      const weakCategories = Object.entries(categoryScores)
        .filter(([, data]) => data.percentage < 60)
        .map(([category]) => category)
        .join(', ') || 'All areas show good performance';
      
      // Calculate average explanation score
      const avgExplanationScore = evaluatedResponses.reduce((sum, r) => sum + r.explanation_score, 0) / totalQuestions;
      
      // Get categories tested
      const categories = Object.keys(categoryScores).join(', ');
      
      const studentName = userContext?.name || 'Student';
      
      const prompt = GROK_PROMPTS.GENERATE_OVERALL_FEEDBACK
        .replace('{student_name}', studentName)
        .replace('{overall_percentage}', overallPercentage.toFixed(1))
        .replace('{total_score}', totalScore.toFixed(1))
        .replace('{max_score}', maxScore)
        .replace('{total_questions}', totalQuestions)
        .replace('{correct_answers}', correctAnswers)
        .replace('{categories}', categories)
        .replace('{category_breakdown}', categoryBreakdown)
        .replace('{strong_categories}', strongCategories)
        .replace('{weak_categories}', weakCategories)
        .replace('{avg_explanation_score}', avgExplanationScore.toFixed(1));
      
      const messages = [
        {
          role: 'system',
          content: 'You are an expert educational advisor and mentor. Provide personalized, encouraging, and actionable feedback that motivates students to improve while acknowledging their efforts and achievements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];
      
      console.log('📝 Sending feedback request to Grok with context:', {
        student: studentName,
        performance: `${overallPercentage.toFixed(1)}%`,
        totalQuestions,
        correctAnswers,
        strongAreas: strongCategories,
        improvementAreas: weakCategories
      });
      
      const response = await this.makeApiCallWithRetry(messages, 1500);
      
      console.log('📄 Raw feedback response:', response);
      
      // Clean up the response - remove any extra formatting
      const cleanFeedback = response
        .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
        .replace(/\\n/g, ' ') // Replace escaped newlines with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      console.log('✅ Generated personalized feedback:', cleanFeedback);
      
      return cleanFeedback;
      
    } catch (error) {
      console.error('💥 Failed to generate overall feedback with Grok:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Return a fallback message that indicates the issue
      const studentName = userContext?.name || 'Student';
      return `Hello ${studentName}! Your assessment has been completed with ${overallPercentage.toFixed(1)}% overall performance. While we're experiencing technical difficulties generating personalized feedback, your results have been saved. Please review your individual question responses for detailed insights into your performance.`;
    }
  }



  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Utility method to test API connection
  async testConnection() {
    console.log('🧪 Testing Groq API connection...');
    try {
      const response = await this.makeApiCallWithRetry([
        {
          role: 'user',
          content: 'Hello, please respond with just "API connection successful"'
        }
      ], 50);

      console.log('✅ API Test Response:', response);
      return response.toLowerCase().includes('api connection successful');
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      throw error;
    }
  }

  // Simple test method to validate API setup
  async validateApiSetup() {
    console.log('🔧 Validating Groq API setup...');

    // Check API key format
    if (!this.apiKey) {
      throw new Error('API key is missing');
    }

    if (!this.apiKey.startsWith('gsk_')) {
      console.warn('⚠️ API key does not start with expected prefix "gsk_"');
    }

    console.log('✅ API key format appears valid');

    // Test basic connectivity
    await this.testConnection();
    console.log('✅ API connectivity test passed');

    return true;
  }
}

export const grokService = new GrokService();
export default grokService;
