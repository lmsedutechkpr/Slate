import { User } from '../models/index.js';
import { UserRoles, InterestTypes, LearningPace, Domains } from '../../shared/schema.js';

// Student Profile Schema for MongoDB
const StudentProfileSchema = {
  yearOfStudy: { type: String, enum: ['1', '2', '3', '4'] },
  degree: String,
  interestType: { type: String, enum: Object.values(InterestTypes) },
  domains: [{ type: String, enum: Domains }],
  careerGoal: String,
  learningPace: { type: String, enum: Object.values(LearningPace) },
  onboarded: { type: Boolean, default: false }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { yearOfStudy, degree, interestType, domains, careerGoal, learningPace } = req.body;
    
    // Validate domains
    const validDomains = domains.filter(domain => Domains.includes(domain));
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'studentProfile.yearOfStudy': yearOfStudy,
          'studentProfile.degree': degree,
          'studentProfile.interestType': interestType,
          'studentProfile.domains': validDomains,
          'studentProfile.careerGoal': careerGoal,
          'studentProfile.learningPace': learningPace,
          'studentProfile.onboarded': true
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

export const createInstructor = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, googleEmail } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new instructor user
    const user = new User({
      username,
      email,
      password,
      role: UserRoles.INSTRUCTOR,
      googleEmail,
      isGoogleLinked: !!googleEmail,
      profile: {
        firstName,
        lastName
      }
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'Instructor created successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create instructor',
      error: error.message
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get users',
      error: error.message
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update user status',
      error: error.message
    });
  }
};
