import { supabase } from './supabaseClient.js';
import ApiClient from './apiClient.js';

/**
 * Dynamic Question Category Service - Manages question categories dynamically from database
 * Replaces hardcoded categories like 'Coding', 'Logic', 'Mathematics' with admin-controlled system
 */
export class DynamicQuestionCategoryService {
  static instance = null;
  static categories = [];
  static categoryMap = new Map();
  static initialized = false;

  static getInstance() {
    if (!this.instance) {
      this.instance = new DynamicQuestionCategoryService();
    }
    return this.instance;
  }

  /**
   * Initialize the service by loading categories from database
   */
  static async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadCategories();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize DynamicQuestionCategoryService:', error);
      // Fallback to default categories if database fails
      this.initializeFallbackCategories();
      this.initialized = true;
    }
  }

  /**
   * Load all active categories from database with robust fallback
   */
  static async loadCategories() {
    try {
      // 1. Try loading from MERN Express API
      try {
        const res = await ApiClient.get('/categories?type=question');
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          this.categories = list;
          this.buildCategoryMap();
          return this.categories;
        }
      } catch (apiErr) {
        console.warn('ApiClient /categories failed, falling back to cache/default:', apiErr.message);
      }

      // 2. Fallback to Supabase if MERN API returned empty
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        this.initializeFallbackCategories();
        return this.categories;
      }

      this.categories = data;
      this.buildCategoryMap();
      return this.categories;
    } catch (err) {
      console.warn('Exception loading question categories, using fallbacks:', err.message);
      this.initializeFallbackCategories();
      return this.categories;
    }
  }

  /**
   * Build internal category map for quick lookups
   */
  static buildCategoryMap() {
    this.categoryMap.clear();
    this.categories.forEach(category => {
      this.categoryMap.set(category.category_id, category);
      // Also map by name for backward compatibility
      this.categoryMap.set(category.name.toLowerCase(), category);
    });
  }

  /**
   * Fallback categories if database is unavailable
   */
  static initializeFallbackCategories() {
    this.categories = [
      {
        category_id: 'coding',
        name: 'Coding',
        description: 'Programming and software development questions',
        icon: 'Code',
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        display_order: 1,
        is_active: true,
        is_system: true
      },
      {
        category_id: 'logic',
        name: 'Logic',
        description: 'Logical reasoning and problem-solving questions',
        icon: 'Brain',
        color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        display_order: 2,
        is_active: true,
        is_system: true
      },
      {
        category_id: 'mathematics',
        name: 'Mathematics',
        description: 'Mathematical concepts and calculations',
        icon: 'Calculator',
        color: 'text-green-400 bg-green-400/10 border-green-400/20',
        display_order: 3,
        is_active: true,
        is_system: true
      },
      {
        category_id: 'language',
        name: 'Language',
        description: 'Language skills and communication',
        icon: 'MessageCircle',
        color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        display_order: 4,
        is_active: true,
        is_system: true
      },
      {
        category_id: 'culture',
        name: 'Culture',
        description: 'Cultural knowledge and awareness',
        icon: 'Globe',
        color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
        display_order: 5,
        is_active: true,
        is_system: true
      },
      {
        category_id: 'vedic_knowledge',
        name: 'Vedic Knowledge',
        description: 'Traditional knowledge and wisdom',
        icon: 'BookOpen',
        color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
        display_order: 6,
        is_active: true,
        is_system: true
      },
      {
        category_id: 'current_affairs',
        name: 'Current Affairs',
        description: 'Current events and general knowledge',
        icon: 'Newspaper',
        color: 'text-red-400 bg-red-400/10 border-red-400/20',
        display_order: 7,
        is_active: true,
        is_system: true
      }
    ];
    this.buildCategoryMap();
  }

  /**
   * Get all active categories
   */
  static async getAllCategories() {
    if (!this.initialized) await this.initialize();
    return this.categories;
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId) {
    if (!this.initialized) await this.initialize();
    return this.categoryMap.get(categoryId) || null;
  }

  /**
   * Get category by name (case insensitive)
   */
  static async getCategoryByName(name) {
    if (!this.initialized) await this.initialize();
    return this.categoryMap.get(name.toLowerCase()) || null;
  }

  /**
   * Get categories for dropdown/selection components
   */
  static async getCategoryOptions() {
    const categories = await this.getAllCategories();
    return categories.map(category => ({
      value: category.category_id,
      label: `${category.icon ? category.icon + ' ' : ''}${category.name}`,
      description: category.description,
      icon: category.icon,
      color: category.color,
    }));
  }

  /**
   * Get categories with question counts for admin interface
   */
  static async getCategoriesWithStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_active_question_categories');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting categories with stats:', error);
      // Fallback to basic categories without counts
      const categories = await this.getAllCategories();
      return categories.map(cat => ({
        ...cat,
        question_count: 0
      }));
    }
  }

  /**
   * Get question weights for AI generation (replaces hardcoded weights)
   */
  
  /**
   * Get question weights by category ID
   */
  
  /**
   * Get category mapping for backward compatibility
   * Maps old hardcoded category names to new category IDs
   */
  static getCategoryMapping() {
    return {
      'Coding': 'coding',
      'Logic': 'logic',
      'Mathematics': 'mathematics',
      'Language': 'language',
      'Culture': 'culture',
      'Vedic Knowledge': 'vedic_knowledge',
      'Current Affairs': 'current_affairs'
    };
  }

  /**
   * Convert old category name to new category ID
   */
  static mapOldCategoryToId(oldCategory) {
    const mapping = this.getCategoryMapping();
    return mapping[oldCategory] || oldCategory.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Refresh categories from database
   */
  static async refresh() {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Add a new category (admin function)
   */
  /**
   * Add a new category (admin function)
   */
  static async addCategory(categoryData) {
    try {
      const res = await ApiClient.post('/categories', {
        category_id: categoryData.category_id,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon || 'Brain',
        color: categoryData.color,
        display_order: categoryData.display_order || 0,
        type: 'question',
        is_system: false,
        is_active: true
      });

      await this.refresh();
      return res?.data || res;
    } catch (err) {
      console.warn('ApiClient addCategory failed, trying fallback:', err.message);
      const { data, error } = await supabase
        .from('question_categories')
        .insert([{
          category_id: categoryData.category_id,
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon,
          color: categoryData.color,
          display_order: categoryData.display_order || 0,
          is_active: true,
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      await this.refresh();
      return data;
    }
  }

  /**
   * Update a category (admin function)
   */
  static async updateCategory(categoryId, updates) {
    try {
      const res = await ApiClient.put(`/categories/${categoryId}`, updates);
      await this.refresh();
      return res?.data || res;
    } catch (err) {
      console.warn('ApiClient updateCategory failed, trying fallback:', err.message);
      const { data, error } = await supabase
        .from('question_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('category_id', categoryId)
        .select()
        .single();

      if (error) throw error;
      await this.refresh();
      return data;
    }
  }

  /**
   * Delete a category (admin function)
   * System categories cannot be deleted
   */
  static async deleteCategory(categoryId) {
    // Check if it's a system category
    const category = await this.getCategoryById(categoryId);
    if (category?.is_system) {
      throw new Error(`Cannot delete system category: ${categoryId}`);
    }

    try {
      await ApiClient.delete(`/categories/${categoryId}`);
      await this.refresh();
      return true;
    } catch (err) {
      console.warn('ApiClient deleteCategory failed, trying fallback:', err.message);
      const { error } = await supabase
        .from('question_categories')
        .delete()
        .eq('category_id', categoryId);

      if (error) throw error;
      await this.refresh();
      return true;
    }
  }

  /**
   * Reorder categories (admin function)
   */
  static async reorderCategories(categoryOrders) {
    for (const { categoryId, order } of categoryOrders) {
      await this.updateCategory(categoryId, { display_order: order }).catch(() => {});
    }
    await this.refresh();
    return true;
  }

  /**
   * Toggle category active status (admin function)
   */
  static async toggleCategoryStatus(categoryId, isActive) {
    return await this.updateCategory(categoryId, { is_active: isActive });
  }

  /**
   * Get questions by category ID
   */
  static async getQuestionsByCategory(categoryId) {
    try {
      const res = await ApiClient.get(`/questions?category=${encodeURIComponent(categoryId)}`);
      return res?.data || (Array.isArray(res) ? res : []);
    } catch (e) {
      const { data, error } = await supabase
        .from('question_banks')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  }

  /**
   * Get questions for multiple categories
   */
  static async getQuestionsByCategories(categoryIds) {
    try {
      const results = [];
      for (const id of categoryIds) {
        const res = await ApiClient.get(`/questions?category=${encodeURIComponent(id)}`);
        const list = res?.data || (Array.isArray(res) ? res : []);
        results.push(...list);
      }
      return results;
    } catch (e) {
      const { data, error } = await supabase
        .from('question_banks')
        .select('*')
        .in('category_id', categoryIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  }
}

// Export convenience functions
export const {
  initialize,
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  getCategoryOptions,
  getCategoriesWithStats,
    mapOldCategoryToId,
  refresh,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  toggleCategoryStatus,
    getQuestionsByCategory,
  getQuestionsByCategories
} = DynamicQuestionCategoryService;

export default DynamicQuestionCategoryService;