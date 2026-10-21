// Field-based question service to replace AI generation

import { ASSIGNMENT_CONFIG, DIFFICULTY_LEVELS, normalizeCategoryName } from "../data/assignment.js";
import {
  QUESTION_BANKS,
  getQuestionsByCategoryAndDifficulty,
} from "../data/questionBanks.js";
import {
  STUDY_FIELDS,
  getQuestionWeightsForField,
  getDifficultyDistributionForField,
  detectStudyFieldFromBackground,
} from "../data/studyFields.js";
import { supabase } from "./supabaseClient.js";
import { grokService } from "./grokService.js";
import { DynamicQuestionCategoryService } from "./dynamicQuestionCategoryService.js";
import { aiSettingsService } from "./aiSettingsService.js";
import ApiClient from "./apiClient.js";

class FieldBasedQuestionService {
  constructor() {
    this.usedQuestions = new Set();
  }

  // Resolve a category input (id or name) to { categoryId, name }
  async resolveCategory(categoryInput) {
    try {
      if (!categoryInput) return { categoryId: null, name: null };
      await DynamicQuestionCategoryService.initialize();
      let cat = await DynamicQuestionCategoryService.getCategoryById(
        categoryInput
      );
      if (cat) return { categoryId: cat.category_id, name: cat.name };
      cat = await DynamicQuestionCategoryService.getCategoryByName(
        categoryInput
      );
      if (cat) return { categoryId: cat.category_id, name: cat.name };
      const mappedId =
        DynamicQuestionCategoryService.mapOldCategoryToId(categoryInput);
      cat = await DynamicQuestionCategoryService.getCategoryById(mappedId);
      if (cat) return { categoryId: cat.category_id, name: cat.name };
      return { categoryId: null, name: String(categoryInput) };
    } catch (e) {
      console.warn("Category resolution failed:", e);
      return { categoryId: null, name: String(categoryInput || "") };
    }
  }

  /**
   * Generate questions based on student's study field
   * @param {Object} studentData - Student's background information
   * @param {number} totalQuestions - Total number of questions to generate
   * @returns {Promise<Array>} Array of questions
   */
  async generateQuestionsForStudent(
    studentData,
    totalQuestions = ASSIGNMENT_CONFIG.TOTAL_QUESTIONS
  ) {
    try {
      // Detect student's study field and grade/category preferences
      const studyField = detectStudyFieldFromBackground(studentData);
      // Build education level tags for filtering (e.g., level_9..12, level_undergraduate, level_graduate, level_postgraduate)
      const levelTags = this.getStudentLevelTags(studentData);
      // Prefer detected studyField for DB mapping if STEM or fallback to explicit field
      const rawField =
        studentData?.background_field_of_study ||
        studentData?.responses?.field_of_study ||
        studentData?.field_of_study;
      const mappingFieldId =
        studyField === 'stem' ? 'stem' : (rawField || studyField);
      console.log(
        `📌 Mapping field for DB queries: ${mappingFieldId} (detected: ${studyField})`
      );

      const preferredCategoryRaw =
        studentData?.responses?.question_category ||
        studentData?.question_category ||
        studentData?.responses?.preferred_category ||
        studentData?.preferred_category ||
        null;
      const normalizedCat = normalizeCategoryName(preferredCategoryRaw);
      const isAllCategories = normalizedCat === "all";
      const strictCategory = !isAllCategories;

      console.log(
        `🎯 Detected study field: ${studyField}, levels: ${
          levelTags.join(",") || "N/A"
        }, rawCategory: ${preferredCategoryRaw || "auto"}, normalizedCategory: ${normalizedCat}`
      );

      // Get weights and difficulty distribution for the field
      const questionWeights = getQuestionWeightsForField(studyField);
      const difficultyDistribution =
        getDifficultyDistributionForField(studyField);

      console.log(`📊 Question weights for ${studyField}:`, questionWeights);
      console.log(`📈 Difficulty distribution:`, difficultyDistribution);

      // Global deduplication helpers for the entire generation run
      const normalizeText = (t) =>
        (t || "")
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      const usedQuestionTexts = new Set();
      const usedQuestionIds = new Set();

      // Calculate target question count per category based on field weights (or strict category if requested)
      const categoryTargets = {};
      if (strictCategory) {
        categoryTargets[normalizedCat] = totalQuestions;
      } else {
        const sortedWeights = Object.entries(questionWeights).sort(
          (a, b) => b[1] - a[1]
        );
        const totalWeightSum = sortedWeights.reduce((sum, [, w]) => sum + w, 0) || 1;
        let allocated = 0;

        const unrounded = sortedWeights.map(([cat, w]) => {
          const rawCount = (w / totalWeightSum) * totalQuestions;
          const count = Math.floor(rawCount);
          return { cat, count, remainder: rawCount - count };
        });

        unrounded.forEach(item => {
          categoryTargets[item.cat] = item.count;
          allocated += item.count;
        });

        let remaining = totalQuestions - allocated;
        if (remaining > 0) {
          unrounded.sort((a, b) => b.remainder - a.remainder);
          for (let i = 0; i < remaining; i++) {
            const item = unrounded[i % unrounded.length];
            categoryTargets[item.cat] = (categoryTargets[item.cat] || 0) + 1;
          }
        }

        Object.keys(categoryTargets).forEach((k) => {
          if (categoryTargets[k] <= 0) delete categoryTargets[k];
        });
      }

      console.log(`📋 Target question distribution per category:`, categoryTargets);

      // Helper for splitting counts by difficulty according to distribution
      const splitByDifficulty = (count) => {
        const entries = [
          [DIFFICULTY_LEVELS.EASY, difficultyDistribution.easy || 0],
          [DIFFICULTY_LEVELS.MEDIUM, difficultyDistribution.medium || 0],
          [DIFFICULTY_LEVELS.HARD, difficultyDistribution.hard || 0],
        ];
        const totals = entries.map(([, weight]) => weight);
        const weightSum = totals.reduce((a, b) => a + b, 0) || 1;
        let allocated = 0;
        const result = {};
        entries.forEach(([diff, weight], idx) => {
          let n = Math.round((weight / weightSum) * count);
          if (count > 0 && n === 0 && idx === 1 /* medium */) n = 1;
          result[diff] = n;
          allocated += n;
        });
        const diffKeys = Object.keys(result);
        while (allocated > count) {
          for (let k of diffKeys) {
            if (allocated <= count) break;
            if (result[k] > 0) {
              result[k]--;
              allocated--;
            }
          }
        }
        while (allocated < count) {
          for (let k of [
            DIFFICULTY_LEVELS.MEDIUM,
            DIFFICULTY_LEVELS.EASY,
            DIFFICULTY_LEVELS.HARD,
          ]) {
            if (allocated >= count) break;
            result[k] = (result[k] || 0) + 1;
            allocated++;
          }
        }
        return result;
      };

      // Check if AI question generation is enabled globally
      const isAIEnabled = await aiSettingsService.isAIEnabled();
      console.log(
        `🤖 AI question generation is ${
          isAIEnabled ? "enabled" : "disabled"
        } globally`
      );

      let combined = [];

      // Iterate through each target category in the distribution
      for (const [categoryName, categoryCount] of Object.entries(categoryTargets)) {
        if (categoryCount <= 0) continue;

        let categoryQuestions = [];
        const diffCounts = splitByDifficulty(categoryCount);

        // 1) Try DB fetch (admin/curated questions for this specific category)
        for (const [diff, count] of Object.entries(diffCounts)) {
          if (count <= 0) continue;
          try {
            let dbQs = await this.getFieldMappedQuestionsFromDatabase(
              mappingFieldId,
              categoryName,
              diff,
              count,
              levelTags,
              true
            );
            if (dbQs.length < count) {
              const topUp = await this.getQuestionsFromDatabase(
                categoryName,
                diff,
                count - dbQs.length,
                levelTags,
                true
              );
              dbQs = dbQs.concat(topUp);
            }
            dbQs.forEach((q) => {
              const nt = normalizeText(q.question_text);
              const qid = q.question_id || q.id;
              if (!nt || usedQuestionTexts.has(nt) || (qid && usedQuestionIds.has(qid))) return;
              usedQuestionTexts.add(nt);
              if (qid) usedQuestionIds.add(qid);
              categoryQuestions.push({
                ...q,
                category: categoryName,
                difficulty: q.difficulty || diff,
                type: "multiple_choice",
                points: q.points ?? 10,
                time_limit_seconds: q.time_limit_seconds ?? 180,
              });
            });
          } catch (e) {
            console.warn(`⚠️ Error fetching DB questions for ${categoryName} - ${diff}:`, e.message);
          }
        }

        // 2) Generate with AI if enabled and category target is not yet satisfied
        const neededForCat = categoryCount - categoryQuestions.length;
        if (isAIEnabled && neededForCat > 0) {
          const aiCounts = splitByDifficulty(neededForCat);
          for (const [diff, count] of Object.entries(aiCounts)) {
            if (count <= 0) continue;
            try {
              const isTechCategory =
                categoryName.toLowerCase().includes("coding") ||
                categoryName.toLowerCase().includes("technical") ||
                categoryName.toLowerCase().includes("programming");
              const aiCategoryLabel = isTechCategory
                ? `${categoryName} (Field: ${mappingFieldId})`
                : categoryName;
              const aiQsRaw = await grokService.generateUniqueQuestions(
                aiCategoryLabel,
                diff,
                count,
                usedQuestionTexts
              );
              const aiQs = aiQsRaw.map((q) => ({
                ...q,
                category: categoryName,
              }));
              await this.storeGeneratedQuestions(
                aiQs,
                mappingFieldId,
                categoryName,
                diff
              );
              aiQs.forEach((q) => {
                const nt = normalizeText(q.question_text);
                if (!nt || usedQuestionTexts.has(nt)) return;
                usedQuestionTexts.add(nt);
                categoryQuestions.push({
                  ...q,
                  category: categoryName,
                  difficulty: q.difficulty || diff,
                  type: "multiple_choice",
                  points: q.points ?? 10,
                  time_limit_seconds: q.time_limit_seconds ?? 180,
                });
              });
            } catch (e) {
              console.warn(
                `⚠️ AI generation failed for ${categoryName} - ${diff}: ${e.message}.`
              );
            }
          }
        }

        // 3) Curated question bank fallback for this specific category
        const remainingForCat = categoryCount - categoryQuestions.length;
        if (remainingForCat > 0) {
          const bankCounts = splitByDifficulty(remainingForCat);
          for (const [diff, count] of Object.entries(bankCounts)) {
            if (count <= 0) continue;
            try {
              const fromBank = await this.getQuestionsForCategoryAndDifficulty(
                categoryName,
                diff,
                count
              );
              fromBank.forEach((q) => {
                const nt = normalizeText(q.question_text);
                if (!nt || usedQuestionTexts.has(nt)) return;
                usedQuestionTexts.add(nt);
                categoryQuestions.push({
                  ...q,
                  category: categoryName,
                });
              });
            } catch (e) {
              console.warn(`⚠️ Curated bank fallback failed for ${categoryName} - ${diff}:`, e.message);
            }
          }
        }

        combined.push(...categoryQuestions);
      }

      // If combined is still under totalQuestions, top up
      if (combined.length < totalQuestions) {
        const remainingNeeded = totalQuestions - combined.length;
        
        // When user requested a specific category (e.g. Current Affairs), ONLY top up using that category!
        const categoriesByWeight = strictCategory
          ? [normalizedCat]
          : Object.entries(questionWeights)
              .sort((a, b) => b[1] - a[1])
              .map(([c]) => c);

        const fillOrder = [
          DIFFICULTY_LEVELS.MEDIUM,
          DIFFICULTY_LEVELS.EASY,
          DIFFICULTY_LEVELS.HARD,
        ];
        let added = 0;
        for (const diff of fillOrder) {
          if (added >= remainingNeeded) break;
          for (const cat of categoriesByWeight) {
            if (added >= remainingNeeded) break;
            try {
              const batch = await this.getQuestionsForCategoryAndDifficulty(
                cat,
                diff,
                remainingNeeded - added
              );
              for (const q of batch) {
                const nt = normalizeText(q.question_text);
                if (!nt || usedQuestionTexts.has(nt)) continue;
                combined.push({
                  ...q,
                  category: cat,
                });
                usedQuestionTexts.add(nt);
                added++;
                if (added >= remainingNeeded) break;
              }
            } catch (e) {
              console.warn(
                `⚠️ Expanded curated fallback failed for ${cat} - ${diff}: ${e.message}`
              );
            }
          }
        }

        // If STILL under totalQuestions for a strict category, pull directly from static QUESTION_BANKS[normalizedCat]
        if (strictCategory && combined.length < totalQuestions) {
          const catBank = QUESTION_BANKS[normalizedCat] || {};
          const catQuestions = Object.values(catBank).flat();
          for (const q of this.shuffleArray(catQuestions)) {
            if (combined.length >= totalQuestions) break;
            const nt = normalizeText(q.question_text);
            if (nt && !usedQuestionTexts.has(nt)) {
              usedQuestionTexts.add(nt);
              combined.push({
                ...q,
                category: normalizedCat
              });
            }
          }
        }
      }

      combined = combined.slice(0, totalQuestions);

      if (combined.length === 0) {
        console.warn("⚠️ No questions generated from DB/AI, generating built-in fallback question set...");
        if (strictCategory) {
          const catBank = QUESTION_BANKS[normalizedCat] || {};
          const catQuestions = Object.values(catBank).flat();
          if (catQuestions.length > 0) {
            return this.shuffleArray(catQuestions).slice(0, totalQuestions).map(q => ({
              ...q,
              category: normalizedCat
            }));
          }
        }
        const fallbacks = [
          {
            id: "fallback_q1",
            question_text: "What is the primary function of an operating system?",
            category: "Coding",
            difficulty: "Easy",
            options: [
              "To manage computer hardware and software resources",
              "To design web pages",
              "To connect to Wi-Fi",
              "To clean up temporary files"
            ],
            correct_answer: "To manage computer hardware and software resources",
            explanation: "Operating systems serve as the core interface between hardware and application software."
          },
          {
            id: "fallback_q2",
            question_text: "Which data structure operates on a First In, First Out (FIFO) principle?",
            category: "Coding",
            difficulty: "Easy",
            options: ["Queue", "Stack", "Tree", "Graph"],
            correct_answer: "Queue",
            explanation: "A Queue operates on FIFO where elements are removed in the order they were added."
          },
          {
            id: "fallback_q3",
            question_text: "If a sequence follows 2, 4, 8, 16, what is the next number?",
            category: "Logic",
            difficulty: "Easy",
            options: ["32", "24", "20", "64"],
            correct_answer: "32",
            explanation: "Each term is multiplied by 2 to get the next term."
          },
          {
            id: "fallback_q4",
            question_text: "All humans are mortal. Socrates is human. What can be concluded?",
            category: "Logic",
            difficulty: "Easy",
            options: [
              "Socrates is mortal",
              "Socrates is immortal",
              "All humans are Socrates",
              "No conclusion can be drawn"
            ],
            correct_answer: "Socrates is mortal",
            explanation: "Deductive reasoning: major premise + minor premise = valid conclusion."
          },
          {
            id: "fallback_q5",
            question_text: "Solve for x: 3x + 9 = 24.",
            category: "Mathematics",
            difficulty: "Medium",
            options: ["5", "4", "6", "3"],
            correct_answer: "5",
            explanation: "3x = 24 - 9 = 15 => x = 5."
          },
          {
            id: "fallback_q6",
            question_text: "What is 15% of 200?",
            category: "Mathematics",
            difficulty: "Easy",
            options: ["30", "25", "35", "40"],
            correct_answer: "30",
            explanation: "15% of 200 = (15/100) * 200 = 30."
          },
          {
            id: "fallback_q7",
            question_text: "Which of the following is a synonym for 'happy'?",
            category: "Language",
            difficulty: "Easy",
            options: ["Joyful", "Sad", "Angry", "Confused"],
            correct_answer: "Joyful",
            explanation: "Joyful means feeling happiness and is a synonym of happy."
          },
          {
            id: "fallback_q8",
            question_text: "Which festival is known as the 'Festival of Lights' in Indian culture?",
            category: "Culture",
            difficulty: "Easy",
            options: ["Diwali", "Holi", "Dussehra", "Eid"],
            correct_answer: "Diwali",
            explanation: "Diwali is celebrated with oil lamps and lights, symbolizing victory of light over darkness."
          },
          {
            id: "fallback_q9",
            question_text: "What is the meaning of 'Yoga' in Sanskrit?",
            category: "Vedic Knowledge",
            difficulty: "Easy",
            options: ["Union or connection", "Exercise", "Meditation", "Breathing"],
            correct_answer: "Union or connection",
            explanation: "Yoga comes from the Sanskrit root 'yuj' meaning to unite or connect."
          },
          {
            id: "fallback_q10",
            question_text: "Which technology has become most prominent in recent years for creating realistic conversational AI?",
            category: "Current Affairs",
            difficulty: "Easy",
            options: [
              "Large Language Models (LLMs)",
              "Blockchain",
              "Virtual Reality",
              "Quantum Computing"
            ],
            correct_answer: "Large Language Models (LLMs)",
            explanation: "Large Language Models like GPT have revolutionized conversational AI and NLP."
          }
        ];
        return this.shuffleArray(fallbacks).slice(0, totalQuestions);
      }

      console.log(
        `✅ Generated multi-category set: ${combined.length} questions across categories (${Object.keys(categoryTargets).join(", ")}) for field ${studyField}`
      );
      return combined;
    } catch (error) {
      console.error("❌ Error generating field-based questions:", error);
      // Fallback to previous distribution-based method
      try {
        const questionWeights = getQuestionWeightsForField(
          detectStudyFieldFromBackground(studentData)
        );
        const difficultyDistribution = getDifficultyDistributionForField(
          detectStudyFieldFromBackground(studentData)
        );
        const questionDistribution = this.calculateQuestionDistribution(
          questionWeights,
          difficultyDistribution,
          totalQuestions
        );
        const questions = await this.generateQuestionsFromDistribution(
          questionDistribution
        );
        console.warn("↩️ Falling back to distribution-based questions.");
        return questions;
      } catch {
        throw new Error(`Failed to generate questions: ${error.message}`);
      }
    }
  }

  /**
   * Calculate question distribution based on weights and difficulty
   */
  calculateQuestionDistribution(
    questionWeights,
    difficultyDistribution,
    totalQuestions
  ) {
    const distribution = {};

    // Calculate questions per category based on weights
    Object.entries(questionWeights).forEach(([category, weight]) => {
      const questionsForCategory = Math.round((weight / 100) * totalQuestions);
      if (questionsForCategory > 0) {
        distribution[category] = {
          total: questionsForCategory,
          difficulties: {},
        };

        // Distribute across difficulties
        Object.entries(difficultyDistribution).forEach(
          ([difficulty, diffWeight]) => {
            const questionsForDifficulty = Math.round(
              (diffWeight / 100) * questionsForCategory
            );
            if (questionsForDifficulty > 0) {
              distribution[category].difficulties[difficulty] =
                questionsForDifficulty;
            }
          }
        );
      }
    });

    // Ensure we have exactly the right number of questions
    this.adjustDistributionToTotal(distribution, totalQuestions);

    return distribution;
  }

  /**
   * Adjust distribution to match exact total
   */
  adjustDistributionToTotal(distribution, totalQuestions) {
    let currentTotal = 0;

    // Count current total
    Object.values(distribution).forEach((categoryDist) => {
      Object.values(categoryDist.difficulties).forEach((count) => {
        currentTotal += count;
      });
    });

    // Adjust if needed
    const difference = totalQuestions - currentTotal;
    if (difference !== 0) {
      // Find the category with the highest weight to adjust
      const categories = Object.keys(distribution);
      if (categories.length > 0) {
        const mainCategory = categories[0]; // Assume first category has highest weight
        const difficulties = Object.keys(
          distribution[mainCategory].difficulties
        );
        if (difficulties.length > 0) {
          const mainDifficulty = difficulties[0];
          distribution[mainCategory].difficulties[mainDifficulty] += difference;

          // Ensure no negative values
          if (distribution[mainCategory].difficulties[mainDifficulty] < 0) {
            distribution[mainCategory].difficulties[mainDifficulty] = 1;
          }
        }
      }
    }
  }

  /**
   * Generate questions from calculated distribution
   */
  async generateQuestionsFromDistribution(distribution) {
    const questions = [];
    this.usedQuestions.clear();

    for (const [category, categoryDist] of Object.entries(distribution)) {
      for (const [difficulty, count] of Object.entries(
        categoryDist.difficulties
      )) {
        if (count > 0) {
          const categoryQuestions =
            await this.getQuestionsForCategoryAndDifficulty(
              category,
              difficulty,
              count
            );
          questions.push(...categoryQuestions);
        }
      }
    }

    // Shuffle questions to randomize order
    return this.shuffleArray(questions);
  }

  /**
   * Get questions for specific category and difficulty
   */
  async getQuestionsForCategoryAndDifficulty(category, difficulty, count) {
    const availableQuestions = getQuestionsByCategoryAndDifficulty(
      category,
      difficulty
    );

    if (availableQuestions.length === 0) {
      console.warn(`⚠️ No questions available for ${category} - ${difficulty}`);
      return [];
    }

    // Filter out already used questions
    const unusedQuestions = availableQuestions.filter(
      (q) => !this.usedQuestions.has(q.id)
    );

    if (unusedQuestions.length === 0) {
      console.warn(
        `⚠️ All questions for ${category} - ${difficulty} have been used`
      );
      // If all questions used, reset and use available questions
      return this.selectRandomQuestions(availableQuestions, count);
    }

    const selectedQuestions = this.selectRandomQuestions(
      unusedQuestions,
      count
    );

    // Mark questions as used
    selectedQuestions.forEach((q) => this.usedQuestions.add(q.id));

    // Add metadata
    return selectedQuestions.map((question) => ({
      ...question,
      category,
      difficulty,
      type: "multiple_choice",
      points: 10,
      time_limit_seconds: 180,
    }));
  }

  /**
   * Select random questions from array
   */
  selectRandomQuestions(questions, count) {
    const shuffled = this.shuffleArray([...questions]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get questions from database (for admin-managed questions) - WITH ENHANCED DEBUGGING
   */
  async getQuestionsFromDatabase(
    category,
    difficulty,
    count,
    levelTags = [],
    excludeAI = false
  ) {
    try {
      console.log(
        `🔍 Fetching general questions: category=${category}, difficulty=${difficulty}, count=${count}, levelTags=${
          (levelTags || []).join(",") || "any"
        }, excludeAI=${excludeAI}`
      );

      const { categoryId, name: categoryName } = await this.resolveCategory(
        category
      );

      let pool = [];

      // 1. Try MERN Express API (MongoDB)
      try {
        const qRes = await ApiClient.get('/questions');
        const list = qRes?.data || qRes?.questions || (Array.isArray(qRes) ? qRes : []);
        if (Array.isArray(list) && list.length > 0) {
          pool = list.filter((q) => {
            const catMatch = !category || (q.category || '').toLowerCase() === category.toLowerCase();
            const diffMatch = !difficulty || (q.difficulty || '').toLowerCase() === difficulty.toLowerCase();
            return (catMatch || !category) && (diffMatch || !difficulty);
          });
          if (pool.length === 0) pool = list; // Use all available questions if specific match is 0
        }
      } catch (err) {
        console.warn('ApiClient /questions fetch failed, trying Supabase fallback:', err.message);
      }

      // 2. Fallback to Supabase if MERN API returned empty
      if (pool.length === 0) {
        let query = supabase
          .from("question_banks")
          .select("*")
          .eq("is_active", true);

        if (excludeAI) {
          query = query.eq("created_by", "admin");
        }

        const isUUID =
          typeof categoryId === "string" &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            categoryId || ""
          );
        if (isUUID) {
          query = query.eq("category_id", categoryId);
        } else {
          query = query.ilike("category", categoryName || category);
        }

        query = query.ilike("difficulty", difficulty);

        if (Array.isArray(levelTags) && levelTags.length > 0) {
          query = query.overlaps("tags", levelTags);
        }

        query = query.limit(count * 3);

        const { data } = await query;
        if (data) pool = data;
      }

      console.log(`✅ getQuestionsFromDatabase returned ${pool?.length || 0} questions`);

      // If not enough and level filter was applied, try contains(tags) for jsonb arrays
      if (
        pool.length < count &&
        Array.isArray(levelTags) &&
        levelTags.length > 0
      ) {
        console.log(`🔁 Retrying with contains(tags) for JSONB array support...`);
        let containsQuery = supabase
          .from("question_banks")
          .select("*")
          .eq("is_active", true)
          .ilike("difficulty", difficulty)
          .limit(count * 2);

        if (excludeAI) {
          containsQuery = containsQuery.eq("created_by", "admin");
        }

        if (categoryId) {
          containsQuery = containsQuery.eq("category_id", categoryId);
        } else {
          containsQuery = containsQuery.ilike("category", categoryName || category);
        }

        containsQuery = containsQuery.contains("tags", levelTags);
        const { data: containsData, error: containsErr } = await containsQuery;
        if (!containsErr && containsData) {
          console.log(`✅ Contains(tags) query returned ${containsData.length} additional questions`);
          const ids0 = new Set(pool.map((q) => q.question_id));
          containsData.forEach((q) => {
            if (!ids0.has(q.question_id)) pool.push(q);
          });
        }
      }

      // If not enough and level filter was applied, try without level as fallback
      if (
        pool.length < count &&
        Array.isArray(levelTags) &&
        levelTags.length > 0
      ) {
        console.log(`🔄 Retrying without level tags filter...`);
        let noLevelQuery = supabase
          .from("question_banks")
          .select("*")
          .eq("is_active", true)
          .ilike("difficulty", difficulty)
          .limit(count * 2);

        if (excludeAI) {
          noLevelQuery = noLevelQuery.eq("created_by", "admin");
        }

        if (categoryId) {
          noLevelQuery = noLevelQuery.eq("category_id", categoryId);
        } else {
          noLevelQuery = noLevelQuery.ilike(
            "category",
            categoryName || category
          );
        }

        const { data: noLevelData, error: noLevelErr } = await noLevelQuery;
        if (!noLevelErr && noLevelData) {
          console.log(
            `✅ No-level query returned ${noLevelData.length} additional questions`
          );
          const ids = new Set(pool.map((q) => q.question_id));
          noLevelData.forEach((q) => {
            if (!ids.has(q.question_id)) pool.push(q);
          });
        }
      }

      // Final fallback: ignore difficulty, keep category only
      if (pool.length < count) {
        console.log(
          `🔄 Final fallback: ignoring difficulty, category-only search...`
        );
        let catOnlyQuery = supabase
          .from("question_banks")
          .select("*")
          .eq("is_active", true)
          .limit(count * 3);

        if (excludeAI) {
          catOnlyQuery = catOnlyQuery.eq("created_by", "admin");
        }

        if (categoryId) {
          catOnlyQuery = catOnlyQuery.eq("category_id", categoryId);
        } else {
          catOnlyQuery = catOnlyQuery.ilike(
            "category",
            categoryName || category
          );
        }

        // In admin-only mode (excludeAI), do not restrict by level tags on final category-only fallback
        if (!excludeAI && Array.isArray(levelTags) && levelTags.length > 0) {
          catOnlyQuery = catOnlyQuery.overlaps("tags", levelTags);
        }

        const { data: catOnlyData, error: catOnlyErr } = await catOnlyQuery;
        if (!catOnlyErr && catOnlyData) {
          console.log(
            `✅ Category-only query returned ${catOnlyData.length} additional questions`
          );
          const ids2 = new Set(pool.map((q) => q.question_id));
          catOnlyData.forEach((q) => {
            if (!ids2.has(q.question_id)) pool.push(q);
          });
        } else if (catOnlyErr) {
          console.error("❌ Category-only query error:", catOnlyErr);
        }
      }

      
      
      
      // If still not enough and we were admin-only, retry including AI-authored with same filters
      if (pool.length < count && excludeAI) {
        console.log(`🧩 Admin-only returned ${pool.length}/${count}. Including AI-authored questions as fallback...`);
        let anyAIQuery = supabase
          .from("question_banks")
          .select("*")
          .eq("is_active", true)
          .limit(count * 3);

        const isUUID2 =
          typeof categoryId === "string" &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            categoryId || ""
          );
        if (isUUID2) {
          anyAIQuery = anyAIQuery.eq("category_id", categoryId);
        } else {
          anyAIQuery = anyAIQuery.ilike("category", categoryName || category);
        }

        if (difficulty) {
          anyAIQuery = anyAIQuery.ilike("difficulty", difficulty);
        }
        if (Array.isArray(levelTags) && levelTags.length > 0) {
          anyAIQuery = anyAIQuery.overlaps("tags", levelTags);
        }

        const { data: anyAIData, error: anyAIErr } = await anyAIQuery;
        if (!anyAIErr && anyAIData) {
          const idsAI = new Set(pool.map((q) => q.question_id));
          anyAIData.forEach((q) => {
            if (!idsAI.has(q.question_id)) pool.push(q);
          });
          console.log(`✅ AI-inclusive fallback added ${pool.length} total questions`);
        } else if (anyAIErr) {
          console.warn("⚠️ AI-inclusive fallback query error:", anyAIErr);
        }
      }

      console.log(`📊 Final pool size: ${pool.length} questions`);
      return this.selectRandomQuestions(pool, count);
    } catch (error) {
      console.error("❌ Database query error:", error);
      return [];
    }
  }

  /**
   * Get questions mapped to a study field domain from MongoDB
   */
  async getFieldMappedQuestionsFromDatabase(
    fieldId,
    category,
    difficulty,
    count,
    levelTags = [],
    excludeAI = false
  ) {
    try {
      const { categoryId, name: categoryName } = await this.resolveCategory(category);
      const queryCat = categoryName || category;

      let url = `/questions?domain=${encodeURIComponent(fieldId)}&category=${encodeURIComponent(queryCat)}&limit=${count * 3}`;
      if (difficulty) {
        url += `&difficulty=${encodeURIComponent(difficulty)}`;
      }

      const res = await ApiClient.get(url);
      const list = res?.data || res?.questions || (Array.isArray(res) ? res : []);

      if (Array.isArray(list) && list.length > 0) {
        let pool = list;
        if (excludeAI) {
          pool = pool.filter((q) => q.created_by === 'admin' || !q.is_ai_generated);
        }
        if (pool.length > 0) {
          console.log(`✅ MongoDB API returned ${pool.length} domain questions for field ${fieldId}`);
          return this.selectRandomQuestions(pool, count);
        }
      }
    } catch (err) {
      console.warn("MongoDB API domain question fetch error:", err.message);
    }

    // Fallback to general category search in MongoDB
    return this.getQuestionsFromDatabase(category, difficulty, count, levelTags, excludeAI);
  }

  // Persist AI-generated questions into MongoDB API
  async storeGeneratedQuestions(
    generatedQuestions,
    fieldId,
    category,
    difficulty
  ) {
    try {
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0)
        return;

      const { name: resolvedCategoryName } = await this.resolveCategory(category);
      const payload = generatedQuestions.map((q, idx) => ({
        question_id: q.id || q.question_id || `q_ai_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        category: resolvedCategoryName || category || q.category || 'General',
        difficulty: (difficulty || q.difficulty || 'medium').toLowerCase(),
        question_text: q.question_text || q.text || '',
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer || q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : ''),
        explanation: q.explanation || '',
        vedic_connection: q.vedic_connection || '',
        modern_application: q.modern_application || '',
        target_domains: fieldId ? [fieldId] : [],
        is_ai_generated: true,
        created_by: 'grok_ai'
      }));

      await ApiClient.post('/questions', payload);
      console.log(`✅ Successfully stored ${payload.length} AI questions in MongoDB API!`);
    } catch (err) {
      console.warn('Error storing AI-generated questions in MongoDB:', err?.message || err);
    }
  }

  /**
   * Get available categories and their question counts
   */
  async getQuestionBankSummary() {
    const summary = {};

    Object.entries(QUESTION_BANKS).forEach(([category, difficulties]) => {
      summary[category] = {};
      Object.entries(difficulties).forEach(([difficulty, questions]) => {
        summary[category][difficulty] = questions.length;
      });
    });

    return summary;
  }

  /**
   * Search questions by text
   */
  searchQuestions(searchTerm) {
    const results = [];

    Object.entries(QUESTION_BANKS).forEach(([category, difficulties]) => {
      Object.entries(difficulties).forEach(([difficulty, questions]) => {
        questions.forEach((question) => {
          if (
            question.question_text
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            question.explanation
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) {
            results.push({
              ...question,
              category,
              difficulty,
            });
          }
        });
      });
    });

    return results;
  }

  /**
   * Validate question format
   */
  validateQuestion(question) {
    const required = [
      "question_text",
      "options",
      "correct_answer",
      "explanation",
    ];
    const missing = required.filter((field) => !question[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error("Questions must have exactly 4 options");
    }

    if (!question.options.includes(question.correct_answer)) {
      throw new Error("Correct answer must be one of the provided options");
    }

    return true;
  }

  /**
   * Derive education level tag(s) from student data
   * Returns array of tags to match, e.g., ['level_9','grade_9'] or ['level_undergraduate']
   */
  getStudentLevelTags(studentData) {
    const tags = [];

    // Try to find an explicit numeric grade (9-12)
    const gradeRaw = studentData?.grade || studentData?.responses?.grade || "";
    const numeric = String(gradeRaw).match(/\b(9|10|11|12)\b/);
    if (numeric) {
      const g = numeric[1];
      tags.push(`level_${g}`, `grade_${g}`); // include legacy grade_ tag for compatibility
      return tags;
    }

    // Try to use class_level/education level
    const lvl =
      studentData?.responses?.class_level ||
      studentData?.class_level ||
      studentData?.background_class_level ||
      "";
    switch ((lvl || "").toLowerCase()) {
      case "high_school":
        // Unknown specific grade: accept any HS level
        tags.push(
          "level_9",
          "level_10",
          "level_11",
          "level_12",
          "grade_9",
          "grade_10",
          "grade_11",
          "grade_12"
        );
        break;
      case "undergraduate":
        tags.push("level_undergraduate");
        break;
      case "graduate":
        tags.push("level_graduate");
        break;
      case "postgraduate":
        tags.push("level_postgraduate");
        break;
      default:
        // No level filter
        break;
    }
    return tags;
  }
}

// Export singleton instance
export const fieldBasedQuestionService = new FieldBasedQuestionService();
export default fieldBasedQuestionService;
