import { Course, Enrollment, User } from '../models/index.js';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';
import { UserRoles } from '../constants.js';

// Multer for handling optional cover upload
const uploadsDir = 'uploads';
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir); } catch {}
export const uploadCourseCoverMiddleware = multer({ dest: uploadsDir + '/' }).single('cover');

export const createCourse = async (req, res) => {
  try {
    const { title, description, category, tags, level, language, price, isPublished } = req.body;
    
    const course = new Course({
      title,
      description,
      category,
      tags: tags || [],
      level,
      language: language || 'English',
      price: price || 0,
      createdBy: req.user._id,
      assignedInstructor: req.user.role === UserRoles.INSTRUCTOR ? req.user._id : null,
      isPublished: isPublished === 'true' || isPublished === true
    });

    // Optional cover upload
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: 'course-covers',
        transformation: [{ width: 800, height: 450, crop: 'fill' }]
      });
      try { fs.unlinkSync(req.file.path); } catch {}
      course.coverUrl = uploadRes.secure_url;
    }
    
    await course.save();
    
    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create course',
      error: error.message
    });
  }
};

export const updateCourseStructure = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ message: 'sections must be an array' });
    }
    const course = await Course.findByIdAndUpdate(
      courseId,
      { $set: { sections } },
      { new: true, runValidators: false }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Structure updated', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update structure', error: error.message });
  }
};

export const uploadLectureVideoMiddleware = multer({ dest: uploadsDir + '/' }).single('video');

export const uploadLectureVideo = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Ensure course exists
    const course = await Course.findById(courseId).select('_id');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const uploadRes = await cloudinary.uploader.upload(req.file.path, {
      folder: 'course-videos',
      resource_type: 'video'
    });
    try { fs.unlinkSync(req.file.path); } catch {}
    res.json({ message: 'Video uploaded', url: uploadRes.secure_url });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload video', error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, category, level, language, price, isPublished } = req.body;
    const update = {};
    if (title != null) update.title = title;
    if (description != null) update.description = description;
    if (category != null) update.category = category;
    if (level != null) update.level = level;
    if (language != null) update.language = language;
    if (price != null) update.price = price;
    if (isPublished != null) update.isPublished = (isPublished === 'true' || isPublished === true);

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: 'course-covers',
        transformation: [{ width: 800, height: 450, crop: 'fill' }]
      });
      try { fs.unlinkSync(req.file.path); } catch {}
      update.coverUrl = uploadRes.secure_url;
    }

    const course = await Course.findByIdAndUpdate(courseId, { $set: update }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course', error: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const { 
      category, 
      level, 
      search, 
      instructorId,
      page = 1, 
      limit = 10,
      isPublished = true 
    } = req.query;
    
    const filter = {};
    
    if (isPublished !== 'false') {
      filter.isPublished = true;
    }
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (instructorId) filter.assignedInstructor = instructorId;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const courses = await Course.find(filter)
      .populate('assignedInstructor', 'username profile')
      .populate('createdBy', 'username profile')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Course.countDocuments(filter);
    
    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get courses',
      error: error.message
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId)
      .populate('assignedInstructor', 'username profile')
      .populate('createdBy', 'username profile');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is enrolled (for students)
    let enrollment = null;
    if (req.user && req.user.role === UserRoles.STUDENT) {
      enrollment = await Enrollment.findOne({
        courseId: course._id,
        studentId: req.user._id
      });
    }
    
    res.json({
      course,
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get course',
      error: error.message
    });
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    
    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return res.status(404).json({ message: 'Course not found or not available' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      courseId,
      studentId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      courseId,
      studentId
    });
    
    await enrollment.save();
    
    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 }
    });
    
    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to enroll in course',
      error: error.message
    });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const enrollments = await Enrollment.find({ studentId })
      .populate({
        path: 'courseId',
        populate: {
          path: 'assignedInstructor',
          select: 'username profile'
        }
      })
      .sort({ lastActivityAt: -1 });
    
    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get enrollments',
      error: error.message
    });
  }
};

export const updateCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lectureId, progressPct } = req.body;
    const studentId = req.user._id;
    
    const enrollment = await Enrollment.findOne({
      courseId,
      studentId
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Update progress
    enrollment.progressPct = progressPct;
    enrollment.lastLectureId = lectureId;
    enrollment.lastActivityAt = new Date();
    
    // Add to completed lectures if not already present
    if (lectureId && !enrollment.completedLectures.some(cl => cl.lectureId === lectureId)) {
      enrollment.completedLectures.push({
        lectureId,
        completedAt: new Date()
      });
    }
    
    // Award XP for progress
    const xpGained = Math.floor(progressPct * 0.1); // Simple XP calculation
    enrollment.xp += xpGained;
    
    await enrollment.save();
    
    res.json({
      message: 'Progress updated successfully',
      enrollment,
      xpGained
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update progress',
      error: error.message
    });
  }
};

export const assignInstructor = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { instructorId } = req.body;
    
    // Verify instructor exists and has correct role
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== UserRoles.INSTRUCTOR) {
      return res.status(400).json({ message: 'Invalid instructor' });
    }
    
    const course = await Course.findByIdAndUpdate(
      courseId,
      { assignedInstructor: instructorId },
      { new: true }
    ).populate('assignedInstructor', 'username profile');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({
      message: 'Instructor assigned successfully',
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to assign instructor',
      error: error.message
    });
  }
};
