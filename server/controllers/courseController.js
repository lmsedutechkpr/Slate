import { Course, Enrollment, User, AuditLog, Review } from '../models/index.js';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';
import { UserRoles } from '../constants.js';

// Multer for handling optional cover upload
const uploadsDir = 'uploads';
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
export const uploadCourseCoverMiddleware = multer({ dest: uploadsDir + '/' }).single('cover');

export const createCourse = async (req, res) => {
  try {
    
    // Validate required fields
    const { title, description, category, tags, level, language, price, isPublished } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        message: 'Title and description are required',
        received: { title: !!title, description: !!description }
      });
    }
    
    const course = new Course({
      title,
      description,
      category,
      tags: tags || [],
      level: level || 'beginner',
      language: language || 'English',
      price: price || 0,
      createdBy: req.user._id,
      assignedInstructor: req.user.role === UserRoles.INSTRUCTOR ? req.user._id : null,
      isPublished: isPublished === 'true' || isPublished === true,
      status: (isPublished === 'true' || isPublished === true) ? 'published' : 'draft'
    });

    // Optional cover upload
    if (req.file) {
      try {
        const uploadRes = await uploadToCloudinary(req.file.path, {
          folder: 'course-covers',
          transformation: [{ width: 800, height: 450, crop: 'fill' }]
        });
        course.coverUrl = uploadRes.secure_url;
        
        // Clean up temp file
        try { 
          fs.unlinkSync(req.file.path); 
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      } catch (uploadError) {
        console.error('Cover upload failed:', uploadError.message);
        // Continue without cover - don't fail the entire course creation
      }
    }
    
    await course.save();
    
    // Try to create audit log (don't fail if this fails)
    try { 
      await AuditLog.create({ 
        action: 'course:create', 
        actorId: req.user._id, 
        actorRole: req.user.role, 
        actorUsername: req.user.username, 
        actorEmail: req.user.email, 
        ip: req.ip, 
        userAgent: req.headers['user-agent'], 
        targetType: 'Course', 
        targetId: String(course._id), 
        meta: { title } 
      }); 
    } catch (auditError) {
      // Ignore audit log creation errors
    }
    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Course validation failed',
        errors: validationErrors
      });
    }
    
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({
        message: 'Course with this title already exists',
        field: Object.keys(error.keyValue)[0]
      });
    }
    
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
    try { await AuditLog.create({ action: 'course:structure:update', actorId: req.user._id, actorRole: req.user.role, actorUsername: req.user.username, actorEmail: req.user.email, ip: req.ip, userAgent: req.headers['user-agent'], targetType: 'Course', targetId: String(course._id) }); } catch {}
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

          const uploadRes = await uploadToCloudinary(req.file.path, {
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
    const { 
      title, 
      description, 
      category, 
      level, 
      language, 
      price, 
      isPublished,
      prerequisites,
      learningOutcomes,
      maxStudents,
      startDate,
      endDate,
      completionCertificate
    } = req.body;
    
    const update = {};
    if (title != null) update.title = title;
    if (description != null) update.description = description;
    if (category != null) update.category = category;
    if (level != null) update.level = level;
    if (language != null) update.language = language;
    if (price != null) update.price = price;
    if (isPublished != null) {
      const pub = (isPublished === 'true' || isPublished === true);
      update.isPublished = pub;
      // Preserve draft/review if toggling off publish without explicit status
      if (pub) update.status = 'published';
      else if (!update.status) update.status = 'archived';
    }
    if (prerequisites != null) update.prerequisites = prerequisites.split(',').map(p => p.trim()).filter(Boolean);
    if (learningOutcomes != null) update.learningOutcomes = learningOutcomes.split(',').map(o => o.trim()).filter(Boolean);
    if (maxStudents != null) update.maxStudents = parseInt(maxStudents);
    if (startDate != null) update.startDate = new Date(startDate);
    if (endDate != null) update.endDate = new Date(endDate);
    if (completionCertificate != null) update.completionCertificate = (completionCertificate === 'true' || completionCertificate === true);

    if (req.file) {
              const uploadRes = await uploadToCloudinary(req.file.path, {
          folder: 'course-covers',
          transformation: [{ width: 800, height: 450, crop: 'fill' }]
        });
      try { fs.unlinkSync(req.file.path); } catch {}
      update.coverUrl = uploadRes.secure_url;
    }

    const course = await Course.findByIdAndUpdate(courseId, { $set: update }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    try { await AuditLog.create({ action: 'course:update', actorId: req.user._id, actorRole: req.user.role, actorUsername: req.user.username, actorEmail: req.user.email, ip: req.ip, userAgent: req.headers['user-agent'], targetType: 'Course', targetId: String(course._id), meta: { update } }); } catch {}
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
      isPublished,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = req.query;
    
    let filter = {};
    
    // Admin pages may request both published/unpublished; default only when query param omitted
    if (isPublished !== undefined && isPublished !== null) {
      if (String(isPublished) === 'true') filter.isPublished = true;
      else if (String(isPublished) === 'false') filter.isPublished = false;
    }
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (req.query.status) {
      const allowed = ['draft','review','published','archived'];
      const st = String(req.query.status);
      if (allowed.includes(st)) filter.status = st;
    }
    if (instructorId) filter.assignedInstructor = instructorId;
    
    const andClauses = [];
    if (search) {
      andClauses.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    if (req.query.status) {
      const st = String(req.query.status);
      if (['draft','review','published','archived'].includes(st)) {
        if (st === 'published') {
          andClauses.push({ $or: [{ status: 'published' }, { isPublished: true }] });
        } else if (st === 'archived') {
          andClauses.push({ $or: [{ status: 'archived' }, { isPublished: false }] });
        } else {
          andClauses.push({ status: st });
        }
      }
    }

    if (andClauses.length > 0) {
      filter = { ...filter, $and: andClauses };
    }
    
    const allowedSort = {
      createdAt: 'createdAt',
      title: 'title',
      price: 'price',
      enrollmentCount: 'enrollmentCount',
    };
    const sortField = allowedSort[sortBy] || 'createdAt';
    const direction = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const courses = await Course.find(filter)
      .populate('assignedInstructor', 'username profile')
      .populate('createdBy', 'username profile')
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ [sortField]: direction });
    
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

// Delete a course (admin or owning instructor)
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    
    console.log(`Deleting course ${courseId} by user ${userId}`);
    
    const course = await Course.findById(courseId);
    if (!course) {
      console.log(`Course not found: ${courseId}`);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log(`Found course: ${course.title} (${course.status})`);
    
    // Check if course has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ courseId: courseId });
    if (enrollmentCount > 0) {
      console.log(`Course has ${enrollmentCount} enrollments, cannot delete`);
      return res.status(400).json({ 
        message: 'Cannot delete course with active enrollments', 
        enrollmentCount 
      });
    }
    
    await Course.findByIdAndDelete(courseId);
    console.log(`Course deleted successfully: ${course.title}`);
    
    // Log the action
    try { 
      await AuditLog.create({ 
        action: 'course:delete', 
        actorId: userId, 
        actorRole: req.user.role, 
        actorUsername: req.user.username, 
        actorEmail: req.user.email, 
        ip: req.ip, 
        userAgent: req.headers['user-agent'], 
        targetType: 'Course', 
        targetId: String(courseId), 
        meta: { title: course.title } 
      }); 
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
    }
    
    res.json({ message: 'Course deleted successfully', courseId });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Failed to delete course', error: error.message });
  }
};

// Bulk publish courses (set isPublished=true)
export const bulkPublishCourses = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array is required' });
    }
    await Course.updateMany({ _id: { $in: ids } }, { $set: { isPublished: true, status: 'published' } });
    try { await AuditLog.create({ action: 'course:bulk:publish', actorId: req.user._id, actorRole: req.user.role, actorUsername: req.user.username, actorEmail: req.user.email, ip: req.ip, userAgent: req.headers['user-agent'], targetType: 'Course', meta: { ids } }); } catch {}
    res.json({ message: 'Courses published', ids });
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish courses', error: error.message });
  }
};

// Bulk archive courses (set isPublished=false)
export const bulkArchiveCourses = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array is required' });
    }
    await Course.updateMany({ _id: { $in: ids } }, { $set: { isPublished: false, status: 'archived' } });
    try { await AuditLog.create({ action: 'course:bulk:archive', actorId: req.user._id, actorRole: req.user.role, actorUsername: req.user.username, actorEmail: req.user.email, ip: req.ip, userAgent: req.headers['user-agent'], targetType: 'Course', meta: { ids } }); } catch {}
    res.json({ message: 'Courses archived', ids });
  } catch (error) {
    res.status(500).json({ message: 'Failed to archive courses', error: error.message });
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
    
    try { await AuditLog.create({ action: 'course:assign-instructor', actorId: req.user._id, actorRole: req.user.role, actorUsername: req.user.username, actorEmail: req.user.email, ip: req.ip, userAgent: req.headers['user-agent'], targetType: 'Course', targetId: String(course._id), meta: { instructorId } }); } catch {}
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

// Get enrollment by course ID
export const getEnrollmentByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const enrollment = await Enrollment.findOne({ 
      courseId, 
      studentId: userId 
    }).populate('courseId', 'title coverUrl');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ enrollment });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get enrollment',
      error: error.message
    });
  }
};

// Get course reviews
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await Review.find({ courseId })
      .populate('studentId', 'username profile')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get course reviews',
      error: error.message
    });
  }
};

// Create course review
export const createCourseReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user._id;

    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({ courseId, studentId: userId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled in this course to write a review' });
    }

    // Create or update review (one per student per course)
    const saved = await Review.findOneAndUpdate(
      { courseId, studentId: userId },
      { $set: { rating, review: review || '' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update course average rating
    const [agg] = await Review.aggregate([
      { $match: { courseId: saved.courseId } },
      { $group: { _id: '$courseId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (agg) {
      await Course.findByIdAndUpdate(courseId, {
        $set: { rating: Math.round(agg.avgRating * 10) / 10 },
        $setOnInsert: { ratingCount: agg.count }
      }, { upsert: false });
    }

    res.status(201).json({ message: 'Review saved', review: saved });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course review', error: error.message });
  }
};

// List courses for the authenticated instructor
export const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ assignedInstructor: instructorId })
      .select('title category level price updatedAt rating enrollmentCount avgProgressPct isPublished coverUrl');
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch instructor courses', error: error.message });
  }
};
