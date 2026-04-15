import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';

//generate jwt
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Api to register user

export const registerUser = async (req, res) => {
  let { email, name, password } = req.body;
  email = email.toLowerCase();
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ success: false, message: 'User already exists' });
    }

    if (password.length <= 5) {
      return res.json({
        status: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API to login user

export const loginUser = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email does not exists',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid  password',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = req.user;
    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//api to get published images

export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      { $unwind: '$messages' },
      {
        $match: {
          'messages.isImage': true,
          'messages.isPublished': true, // ✅ fixed typo
        },
      },
      {
        $project: {
          _id: 0,
          imageUrl: '$messages.content',
          username: '$userName', // ✅ verify this matches your schema
        },
      },
    ]);

    res.json({ success: true, images: publishedImageMessages.reverse() });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
