import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'gurukul_jwt_secret_key_2026', {
    expiresIn: '30d'
  });
};

const checkDbConnected = (res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const currentState = states[mongoose.connection.readyState] || 'unknown';

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      error: `Database connection offline (State: ${currentState}). Please check backend server .env config, MongoDB cluster status, or restart server process.`
    });
    return false;
  }
  return true;
};

export const registerUser = async (req, res) => {
  if (!checkDbConnected(res)) return;

  try {
    const { full_name, email, password, role = 'student' } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Full name, email, and password are required' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const user = await User.create({
      full_name,
      email: email.toLowerCase(),
      password,
      role
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        field_of_study: user.field_of_study,
        selected_domains: user.selected_domains
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const loginUser = async (req, res) => {
  if (!checkDbConnected(res)) return;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        field_of_study: user.field_of_study,
        selected_domains: user.selected_domains
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMe = async (req, res) => {
  if (!checkDbConnected(res)) return;

  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role,
        field_of_study: req.user.field_of_study,
        selected_domains: req.user.selected_domains,
        intake_data: req.user.intake_data,
        assessment_history: req.user.assessment_history
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
