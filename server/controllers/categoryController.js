import Category from '../models/Category.js';

const buildCategoryFilter = (id) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id));
  return isObjectId ? { $or: [{ category_id: id }, { _id: id }] } : { category_id: id };
};

const DEFAULT_QUESTION_CATEGORIES = [
  {
    category_id: 'coding',
    name: 'Coding',
    description: 'Programming, software development, syntax, algorithms',
    icon: 'Code',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    display_order: 1,
    type: 'question',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'logic',
    name: 'Logic',
    description: 'Logical reasoning, problem-solving, cognitive ability',
    icon: 'Brain',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    display_order: 2,
    type: 'question',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'mathematics',
    name: 'Mathematics',
    description: 'Mathematical reasoning, quantitative aptitude, formulas',
    icon: 'Calculator',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    display_order: 3,
    type: 'question',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'language',
    name: 'Language',
    description: 'Communication skills, comprehension, linguistic expression',
    icon: 'MessageCircle',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    display_order: 4,
    type: 'question',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'culture',
    name: 'Culture',
    description: 'Heritage, ethics, cultural context, global values',
    icon: 'Globe',
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    display_order: 5,
    type: 'question',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'vedic_knowledge',
    name: 'Vedic Knowledge',
    description: 'Foundational philosophy, Sutras, ancient scientific insights',
    icon: 'Scroll',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    display_order: 6,
    type: 'question',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'current_affairs',
    name: 'Current Affairs',
    description: 'Modern technical developments, innovation trends, awareness',
    icon: 'Newspaper',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    display_order: 7,
    type: 'question',
    is_system: true,
    is_active: true
  }
];

const DEFAULT_FORM_CATEGORIES = [
  {
    category_id: 'background_selection',
    name: 'Background Selection',
    description: 'Tell us about your academic background and goals',
    icon: 'GraduationCap',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    display_order: 1,
    type: 'form',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'personal_info',
    name: 'Personal Information',
    description: 'Basic information about you',
    icon: 'User',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    display_order: 2,
    type: 'form',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'academic_info',
    name: 'Academic Details',
    description: 'Your educational background and preferences',
    icon: 'BookOpen',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    display_order: 3,
    type: 'form',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'preferences',
    name: 'Learning Preferences',
    description: 'How you prefer to learn',
    icon: 'Settings',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    display_order: 4,
    type: 'form',
    is_system: true,
    is_active: true
  },
  {
    category_id: 'general',
    name: 'Additional Information',
    description: 'Other relevant details',
    icon: 'FileText',
    color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    display_order: 5,
    type: 'form',
    is_system: true,
    is_active: true
  }
];

export const getCategories = async (req, res) => {
  try {
    const { type, include_inactive } = req.query;
    const filter = {};
    if (include_inactive !== 'true') {
      filter.is_active = true;
    }
    if (type) filter.type = type;

    // Auto-seed default categories if collection has none for the requested type
    if (!type || type === 'question') {
      const qCount = await Category.countDocuments({ type: 'question' });
      if (qCount === 0) {
        await Category.insertMany(DEFAULT_QUESTION_CATEGORIES, { ordered: false }).catch(() => {});
      }
    }
    if (type === 'form') {
      const fCount = await Category.countDocuments({ type: 'form' });
      if (fCount === 0) {
        await Category.insertMany(DEFAULT_FORM_CATEGORIES, { ordered: false }).catch(() => {});
      }
    }

    const categories = await Category.find(filter).sort({ display_order: 1, name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { category_id, name, description, icon, color, display_order, type = 'question', is_system = false } = req.body;
    
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const catId = (category_id && String(category_id).trim())
      ? String(category_id).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      : String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const existing = await Category.findOne({ category_id: catId });
    if (existing) {
      existing.name = String(name).trim();
      if (description !== undefined) existing.description = description;
      if (icon) existing.icon = icon;
      if (color) existing.color = color;
      if (display_order !== undefined) existing.display_order = display_order;
      if (type) existing.type = type;
      existing.is_active = true;
      await existing.save();
      return res.json({ success: true, data: existing, message: 'Category updated' });
    }

    const newCategory = new Category({
      category_id: catId,
      name: String(name).trim(),
      description: description || '',
      icon: icon || 'Brain',
      color: color || 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      display_order: display_order ?? 0,
      type,
      is_system,
      is_active: true
    });

    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, category_id, ...safeUpdates } = req.body;
    const updated = await Category.findOneAndUpdate(
      buildCategoryFilter(id),
      safeUpdates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne(buildCategoryFilter(id));
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    if (category.is_system && req.query.permanent !== 'true') {
      return res.status(400).json({ success: false, error: `Cannot delete system category: ${category.category_id}. You can deactivate it instead.` });
    }

    if (req.query.soft === 'true') {
      category.is_active = false;
      await category.save();
      return res.json({ success: true, message: 'Category deactivated successfully' });
    }

    await Category.deleteOne({ _id: category._id });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
