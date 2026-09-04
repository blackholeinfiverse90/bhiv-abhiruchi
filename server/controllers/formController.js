import FormConfig from '../models/FormConfig.js';

export const getFormConfig = async (req, res) => {
  try {
    const config = await FormConfig.findOne({ is_active: true });
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateFormConfig = async (req, res) => {
  try {
    const { config_id = 'default_intake_form', title, fields } = req.body;
    const updated = await FormConfig.findOneAndUpdate(
      { config_id },
      { title, fields, is_active: true },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
