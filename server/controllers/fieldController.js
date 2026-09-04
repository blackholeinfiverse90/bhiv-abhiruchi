import StudyField from '../models/StudyField.js';

export const getFields = async (req, res) => {
  try {
    const fields = await StudyField.find({ is_active: true });
    res.json({ success: true, data: fields });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFieldById = async (req, res) => {
  try {
    const field = await StudyField.findOne({ field_id: req.params.id });
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
    const newField = new StudyField(req.body);
    await newField.save();
    res.status(201).json({ success: true, data: newField });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateField = async (req, res) => {
  try {
    const updated = await StudyField.findOneAndUpdate(
      { field_id: req.params.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
