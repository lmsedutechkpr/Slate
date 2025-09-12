import { User, AuditLog, Course, Enrollment } from '../models/index.js';
import { UserRoles, InterestTypes, LearningPace, Domains } from '../constants.js';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';
import path from 'path';

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
    const { 
      yearOfStudy, 
      degree, 
      university,
      interestType, 
      domains = [], 
      careerGoal, 
      learningPace, 
      firstName, 
      lastName, 
      phone, 
      nickname, 
      username,
      dateOfBirth,
      gender,
      preferredLanguage,
      studyGoals = [],
      timeZone
    } = req.body;
    
    // Validate domains
    const validDomains = domains.filter(domain => Domains.includes(domain));
    
    // If username provided, ensure it's unique (and not changing to same)
    if (username && username !== req.user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if this is a complete onboarding submission
    const hasRequiredOnboardingData = yearOfStudy && degree && interestType && validDomains.length > 0 && learningPace;
    
    const updateData = {
      'profile.firstName': firstName ?? req.user.profile?.firstName,
      'profile.lastName': lastName ?? req.user.profile?.lastName,
      'profile.nickname': nickname ?? req.user.profile?.nickname,
      'profile.phone': phone ?? req.user.profile?.phone,
      'profile.dateOfBirth': dateOfBirth ?? req.user.profile?.dateOfBirth,
      'profile.gender': gender ?? req.user.profile?.gender,
      'username': username ?? req.user.username,
    };

    // Only add student profile fields if they are provided
    if (yearOfStudy) updateData['studentProfile.yearOfStudy'] = yearOfStudy;
    if (degree) updateData['studentProfile.degree'] = degree;
    if (university) updateData['studentProfile.university'] = university;
    if (interestType) updateData['studentProfile.interestType'] = interestType;
    if (validDomains.length > 0) updateData['studentProfile.domains'] = validDomains;
    if (careerGoal) updateData['studentProfile.careerGoal'] = careerGoal;
    if (learningPace) updateData['studentProfile.learningPace'] = learningPace;
    if (preferredLanguage) updateData['studentProfile.preferredLanguage'] = preferredLanguage;
    if (studyGoals.length > 0) updateData['studentProfile.studyGoals'] = studyGoals;
    if (timeZone) updateData['studentProfile.timeZone'] = timeZone;
    
    // Only set onboarded to true if we have complete onboarding data
    if (hasRequiredOnboardingData) {
      updateData['studentProfile.onboarded'] = true;
      updateData['completedOnboarding'] = true;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
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

// Admin profile updater (role: admin). Updates only basic profile fields
export const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, phone, nickname, username } = req.body || {};

    // Enforce unique username if changed
    if (username && username !== req.user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'profile.firstName': firstName ?? req.user.profile?.firstName,
          'profile.lastName': lastName ?? req.user.profile?.lastName,
          'profile.nickname': nickname ?? req.user.profile?.nickname,
          'profile.phone': phone ?? req.user.profile?.phone,
          'username': username ?? req.user.username,
        }
      },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    try { await AuditLog.create({ action: 'admin:profile:update', actorId: req.user._id, actorRole: req.user.role, actorUsername: req.user.username, actorEmail: req.user.email, ip: req.ip, userAgent: req.headers['user-agent'], targetType: 'User', targetId: String(user._id) }); } catch {}
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
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

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await user.comparePassword(currentPassword || '')
    if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    try { await AuditLog.create({ action: 'user:password:update', actorId: req.user._id, actorRole: req.user.role, actorUsername: req.user.username, actorEmail: req.user.email, ip: req.ip, userAgent: req.headers['user-agent'], targetType: 'User', targetId: String(user._id) }); } catch {}
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
};

function generateCode(len = 6) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
}

export const requestEmailChange = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: 'New email required' });
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const user = await User.findByIdAndUpdate(userId, {
      $set: {
        'emailVerification.pendingEmail': newEmail.toLowerCase(),
        'emailVerification.code': code,
        'emailVerification.expiresAt': expiresAt,
      }
    }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // TODO: integrate email provider; for now return code for dev
    res.json({ message: 'Verification code sent', devCode: code });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request email change', error: error.message });
  }
};

export const verifyEmailChange = async (req, res) => {
  try {
    const userId = req.user._id;
    const { code } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ev = user.emailVerification || {};
    if (!ev.code || !ev.pendingEmail) return res.status(400).json({ message: 'No email change requested' });
    if (ev.expiresAt && new Date(ev.expiresAt) < new Date()) return res.status(400).json({ message: 'Code expired' });
    if (String(code) !== String(ev.code)) return res.status(400).json({ message: 'Invalid code' });
    user.email = ev.pendingEmail.toLowerCase();
    user.emailVerification = undefined;
    await user.save();
    res.json({ message: 'Email updated successfully', email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify email change', error: error.message });
  }
};

// Avatar upload setup
// Ensure uploads directory exists for multer temp files
const uploadsDir = 'uploads';
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir); } catch {}
const upload = multer({ dest: uploadsDir + '/' });
export const uploadAvatarMiddleware = upload.single('avatar');

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const localPath = req.file.path;
    const result = await uploadToCloudinary(localPath, {
      folder: 'avatars',
      transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }]
    });

    // Clean up temp file
    try { fs.unlinkSync(localPath); } catch {}

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { 'profile.avatar': result.secure_url } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Avatar updated', avatar: user.profile?.avatar, user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
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
    const { role, status, page = 1, limit = 10, search, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [
        { username: rx },
        { email: rx },
        { googleEmail: rx },
        { 'profile.firstName': rx },
        { 'profile.lastName': rx },
        { 'profile.nickname': rx },
      ];
    }
    
    // Sorting whitelist
    const allowedSort = {
      createdAt: 'createdAt',
      username: 'username',
      email: 'email',
      role: 'role',
      status: 'status',
    };
    const sortField = allowedSort[sortBy] || 'createdAt';
    const direction = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const users = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ [sortField]: direction });
    
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

export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { Enrollment, Course } = await import('../models/index.js');
    const enrollments = await Enrollment.find({ studentId: userId })
      .populate({ path: 'courseId', select: 'title sections estimatedHours' })
      .sort({ lastActivityAt: -1 });

    const progress = enrollments.map(e => {
      const course = e.courseId;
      const totalLectures = (course?.sections || []).reduce((sum, s) => sum + (s.lectures?.length || 0), 0);
      const completed = e.completedLectures?.length || 0;
      return {
        enrollmentId: e._id,
        courseId: course?._id,
        courseTitle: course?.title,
        progressPct: e.progressPct || 0,
        completedLectures: completed,
        totalLectures,
        lastActivityAt: e.lastActivityAt,
        xp: e.xp || 0,
      };
    });

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user progress', error: error.message });
  }
};

export const getInstructorStudents = async (req, res) => {
  try {
    const instructorId = req.user._id;
    
    // Get all courses assigned to this instructor
    const courses = await Course.find({ assignedInstructor: instructorId }).select('_id');
    const courseIds = courses.map(c => c._id);
    
    if (courseIds.length === 0) {
      return res.json({ students: [] });
    }
    
    // Get all enrollments for these courses
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate('studentId', 'username email profile status')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    
    // Group students by their ID and aggregate their data
    const studentMap = new Map();
    
    enrollments.forEach(enrollment => {
      const studentId = enrollment.studentId._id.toString();
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          _id: enrollment.studentId._id,
          username: enrollment.studentId.username,
          email: enrollment.studentId.email,
          profile: enrollment.studentId.profile,
          status: enrollment.studentId.status,
          enrolledCourses: [],
          totalProgress: 0,
          courseCount: 0
        });
      }
      
      const student = studentMap.get(studentId);
      student.enrolledCourses.push({
        courseId: enrollment.courseId._id,
        courseTitle: enrollment.courseId.title,
        progress: enrollment.progressPct || 0,
        enrolledAt: enrollment.createdAt
      });
      student.totalProgress += enrollment.progressPct || 0;
      student.courseCount += 1;
    });
    
    // Convert map to array and calculate average progress
    const students = Array.from(studentMap.values()).map(student => ({
      ...student,
      progress: student.courseCount > 0 ? Math.round(student.totalProgress / student.courseCount) : 0,
      enrolledAt: student.enrolledCourses.length > 0 
        ? student.enrolledCourses[0].enrolledAt 
        : new Date()
    }));
    
    res.json({ students });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch instructor students',
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
