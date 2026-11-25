import StudyField from '../models/StudyField.js';

const buildFieldFilter = (id) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id));
  return isObjectId ? { $or: [{ field_id: id }, { _id: id }] } : { field_id: id };
};

export const getFields = async (req, res) => {
  try {
    const filter = req.query.include_inactive === 'true' ? {} : { is_active: true };
    const fields = await StudyField.find(filter).sort({ name: 1 });
    res.json({ success: true, data: fields });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFieldById = async (req, res) => {
  try {
    const field = await StudyField.findOne(buildFieldFilter(req.params.id));
    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }
    res.json({ success: true, data: field });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createField = async (req, res) => {
  try {
    const { field_id, name, short_name, description, subcategories, icon_name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Field name is required' });
    }
    const cleanName = String(name).trim();
    const resolvedFieldId = (field_id && String(field_id).trim())
      ? String(field_id).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const existing = await StudyField.findOne({ field_id: resolvedFieldId });
    if (existing) {
      existing.name = cleanName;
      existing.short_name = short_name || existing.short_name || cleanName;
      if (description !== undefined) existing.description = description;
      if (subcategories !== undefined) existing.subcategories = subcategories;
      if (icon_name) existing.icon_name = icon_name;
      existing.is_active = true;
      await existing.save();
      return res.json({ success: true, data: existing, message: 'Study field updated' });
    }

    const newField = new StudyField({
      ...req.body,
      field_id: resolvedFieldId,
      name: cleanName,
      short_name: (short_name && String(short_name).trim()) || cleanName,
      is_active: true
    });
    await newField.save();
    res.status(201).json({ success: true, data: newField });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateField = async (req, res) => {
  try {
    const { _id, field_id, ...updates } = req.body;
    const updated = await StudyField.findOneAndUpdate(
      buildFieldFilter(req.params.id),
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Study field not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteField = async (req, res) => {
  try {
    const field = await StudyField.findOne(buildFieldFilter(req.params.id));
    if (!field) {
      return res.status(404).json({ success: false, error: 'Study field not found' });
    }
    if (req.query.permanent === 'true') {
      await StudyField.deleteOne({ _id: field._id });
      return res.json({ success: true, message: 'Study field deleted permanently' });
    }
    field.is_active = false;
    await field.save();
    res.json({ success: true, message: 'Study field deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
