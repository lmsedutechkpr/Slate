import { User, Course, Enrollment, AuditLog } from '../models/index.js';

export const getOverview = async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalInstructors, totalCourses, totalEnrollments, activeUsers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      Course.countDocuments({}),
      Enrollment.countDocuments({}),
      User.countDocuments({ status: 'active' })
    ]);

    // Calculate revenue and growth
    const totalRevenue = 0; // Placeholder for future implementation
    const monthlyGrowth = 0; // Placeholder for future implementation

    res.json({
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      monthlyGrowth,
      activeUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get analytics overview', error: error.message });
  }
};

export const getStudentAnalytics = async (req, res) => {
  try {
    const { courseId, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { role: 'student' };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Get students with pagination
    const students = await User.find(query)
      .select('username email profile studentProfile createdAt status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalStudents = await User.countDocuments(query);

    // Get enrollment data for each student
    const studentsWithEnrollments = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.find({ studentId: student._id })
          .populate('courseId', 'title category level')
          .sort({ lastActivityAt: -1 });

        const totalCourses = enrollments.length;
        const completedCourses = enrollments.filter(e => e.isCompleted).length;
        const totalProgress = enrollments.reduce((sum, e) => sum + (e.progressPct || 0), 0);
        const avgProgress = totalCourses > 0 ? totalProgress / totalCourses : 0;
        const totalXP = enrollments.reduce((sum, e) => sum + (e.xp || 0), 0);

        return {
          ...student.toObject(),
          analytics: {
            totalCourses,
            completedCourses,
            avgProgress: Math.round(avgProgress),
            totalXP,
            lastActivity: enrollments.length > 0 ? enrollments[0].lastActivityAt : null
          },
          enrollments: courseId ? enrollments.filter(e => e.courseId._id.toString() === courseId) : enrollments
        };
      })
    );

    res.json({
      students: studentsWithEnrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalStudents,
        pages: Math.ceil(totalStudents / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get student analytics', error: error.message });
  }
};

export const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId).populate('assignedInstructor', 'username profile');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get all enrollments for this course
    const enrollments = await Enrollment.find({ courseId })
      .populate('studentId', 'username email profile studentProfile');

    // Calculate course statistics
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => e.progressPct > 0).length;
    const completedEnrollments = enrollments.filter(e => e.isCompleted).length;
    const avgProgress = totalEnrollments > 0 
      ? enrollments.reduce((sum, e) => sum + (e.progressPct || 0), 0) / totalEnrollments 
      : 0;

    // Get progress distribution
    const progressDistribution = {
      '0-20%': enrollments.filter(e => e.progressPct <= 20).length,
      '21-40%': enrollments.filter(e => e.progressPct > 20 && e.progressPct <= 40).length,
      '41-60%': enrollments.filter(e => e.progressPct > 40 && e.progressPct <= 60).length,
      '61-80%': enrollments.filter(e => e.progressPct > 60 && e.progressPct <= 80).length,
      '81-100%': enrollments.filter(e => e.progressPct > 80).length
    };

    // Get student engagement data
    const studentEngagement = enrollments.map(enrollment => ({
      student: {
        id: enrollment.studentId._id,
        username: enrollment.studentId.username,
        email: enrollment.studentId.email,
        profile: enrollment.studentId.profile
      },
      progress: enrollment.progressPct,
      xp: enrollment.xp,
      lastActivity: enrollment.lastActivityAt,
      isCompleted: enrollment.isCompleted,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt
    }));

    res.json({
      course: {
        id: course._id,
        title: course.title,
        category: course.category,
        level: course.level,
        instructor: course.assignedInstructor,
        totalSections: course.sections.length,
        totalLectures: course.sections.reduce((sum, s) => sum + s.lectures.length, 0)
      },
      statistics: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        avgProgress: Math.round(avgProgress),
        completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
      },
      progressDistribution,
      studentEngagement
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get course analytics', error: error.message });
  }
};

export const getInstructorAnalytics = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    if (!instructorId) {
      return res.status(400).json({ message: 'Instructor ID is required' });
    }

    const instructor = await User.findById(instructorId).select('username email profile');
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Get all courses assigned to this instructor
    const courses = await Course.find({ assignedInstructor: instructorId });
    const courseIds = courses.map(c => c._id);

    // Get enrollment data for all courses
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } });

    // Calculate instructor statistics
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.isPublished).length;
    const totalEnrollments = enrollments.length;
    const totalStudents = new Set(enrollments.map(e => e.studentId.toString())).size;

    // Calculate average course performance
    const coursePerformance = await Promise.all(
      courses.map(async (course) => {
        const courseEnrollments = enrollments.filter(e => e.courseId.toString() === course._id.toString());
        const avgProgress = courseEnrollments.length > 0
          ? courseEnrollments.reduce((sum, e) => sum + (e.progressPct || 0), 0) / courseEnrollments.length
          : 0;

        return {
          courseId: course._id,
          title: course.title,
          enrollments: courseEnrollments.length,
          avgProgress: Math.round(avgProgress),
          isPublished: course.isPublished
        };
      })
    );

    res.json({
      instructor: {
        id: instructor._id,
        username: instructor.username,
        email: instructor.email,
        profile: instructor.profile
      },
      statistics: {
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalStudents
      },
      coursePerformance
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get instructor analytics', error: error.message });
  }
};


