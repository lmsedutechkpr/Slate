import { User, Course, Review, AuditLog } from '../models/index.js';

// Get all instructors with detailed stats
export const getAllInstructors = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    
    console.log(`Fetching instructors with status: ${status}, search: ${search}`);
    
    // Build query
    let query = { role: 'instructor' };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    const instructors = await User.find(query)
      .select('-password -refreshToken')
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    console.log(`Found ${instructors.length} instructors`);

    // Get detailed stats for each instructor
    const instructorsWithStats = await Promise.all(
      instructors.map(async (instructor) => {
        // Get assigned courses
        const assignedCourses = await Course.find({ instructor: instructor._id });
        
        // Get total students across all courses
        const totalStudents = await Course.aggregate([
          { $match: { instructor: instructor._id } },
          { $unwind: '$enrollments' },
          { $group: { _id: null, uniqueStudents: { $addToSet: '$enrollments.student' } } },
          { $project: { totalStudents: { $size: '$uniqueStudents' } } }
        ]);
        
        // Get performance rating from course reviews
        const courseIds = assignedCourses.map(course => course._id);
        const reviews = await Review.find({ courseId: { $in: courseIds } });
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;
        
        // Get total revenue (if tracking revenue sharing)
        const totalRevenue = await Course.aggregate([
          { $match: { instructor: instructor._id } },
          { $unwind: '$enrollments' },
          { $group: { _id: null, totalRevenue: { $sum: '$enrollments.price' } } }
        ]);

        return {
          ...instructor.toObject(),
          assignedCoursesCount: assignedCourses.length,
          totalStudents: totalStudents[0]?.totalStudents || 0,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
          assignedCourses: assignedCourses.map(course => ({
            _id: course._id,
            title: course.title,
            enrollments: course.enrollments?.length || 0,
            price: course.price,
            status: course.status
          }))
        };
      })
    );

    const total = await User.countDocuments(query);

    console.log(`Returning ${instructorsWithStats.length} instructors with stats`);

    res.json({
      instructors: instructorsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch instructors',
      error: error.message
    });
  }
};

// Get instructor by ID with detailed information
export const getInstructorById = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    const instructor = await User.findById(instructorId)
      .select('-password -refreshToken');
    
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Get assigned courses with detailed stats
    const assignedCourses = await Course.find({ instructor: instructorId })
      .populate('enrollments.student', 'username email firstName lastName')
      .sort({ createdAt: -1 });

    // Get performance analytics
    const courseIds = assignedCourses.map(course => course._id);
    const reviews = await Review.find({ courseId: { $in: courseIds } })
      .populate('student', 'username firstName lastName');

    // Calculate analytics
    const totalStudents = new Set();
    const monthlyEnrollments = {};
    const courseRatings = {};
    let totalRevenue = 0;

    assignedCourses.forEach(course => {
      course.enrollments?.forEach(enrollment => {
        totalStudents.add(enrollment.student.toString());
        
        const month = new Date(enrollment.enrolledAt).toISOString().slice(0, 7);
        monthlyEnrollments[month] = (monthlyEnrollments[month] || 0) + 1;
        
        totalRevenue += enrollment.price || 0;
      });
    });

    reviews.forEach(review => {
      if (!courseRatings[review.courseId]) {
        courseRatings[review.courseId] = [];
      }
      courseRatings[review.courseId].push(review.rating);
    });

    // Calculate average ratings per course
    const coursesWithRatings = assignedCourses.map(course => {
      const courseReviews = courseRatings[course._id] || [];
      const averageRating = courseReviews.length > 0 
        ? courseReviews.reduce((sum, rating) => sum + rating, 0) / courseReviews.length 
        : 0;
      
      return {
        ...course.toObject(),
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: courseReviews.length
      };
    });

    // Get monthly analytics for the last 12 months
    const monthlyAnalytics = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      monthlyAnalytics.push({
        month: monthKey,
        enrollments: monthlyEnrollments[monthKey] || 0
      });
    }

    res.json({
      instructor: {
        ...instructor.toObject(),
        totalStudents: totalStudents.size,
        totalRevenue,
        averageRating: reviews.length > 0 
          ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 
          : 0
      },
      assignedCourses: coursesWithRatings,
      reviews: reviews.slice(0, 10), // Latest 10 reviews
      monthlyAnalytics,
      totalReviews: reviews.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch instructor details',
      error: error.message
    });
  }
};

// Update instructor status
export const updateInstructorStatus = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { status } = req.body;
    const adminId = req.user._id;

    console.log(`Updating instructor ${instructorId} status to ${status}`);

    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      console.log(`Instructor not found: ${instructorId}`);
      return res.status(404).json({ message: 'Instructor not found' });
    }

    const previousStatus = instructor.status;
    console.log(`Previous status: ${previousStatus}, New status: ${status}`);
    
    instructor.status = status;
    await instructor.save();

    console.log(`Instructor status updated successfully. New status: ${instructor.status}`);

    // Log the action
    await AuditLog.create({
      action: 'update_instructor_status',
      performedBy: adminId,
      targetType: 'user',
      targetId: instructorId,
      details: { 
        instructorName: instructor.username, 
        newStatus: status,
        previousStatus: previousStatus 
      }
    });

    res.json({
      message: 'Instructor status updated successfully',
      instructor
    });
  } catch (error) {
    console.error('Error updating instructor status:', error);
    res.status(500).json({
      message: 'Failed to update instructor status',
      error: error.message
    });
  }
};

// Get instructor KPIs
export const getInstructorKPIs = async (req, res) => {
  try {
    console.log('Fetching instructor KPIs');
    
    // Total active instructors
    const totalActiveInstructors = await User.countDocuments({ 
      role: 'instructor', 
      status: 'active' 
    });

    // Pending applications
    const pendingApplications = await User.countDocuments({ 
      role: 'instructor', 
      status: 'pending' 
    });

    console.log(`Active instructors: ${totalActiveInstructors}, Pending: ${pendingApplications}`);

    // Top instructor by student count
    const topInstructor = await User.aggregate([
      { $match: { role: 'instructor', status: 'active' } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'instructor',
          as: 'courses'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses._id',
          foreignField: 'enrollments.course',
          as: 'enrollments'
        }
      },
      {
        $addFields: {
          totalStudents: { $size: { $setUnion: ['$enrollments.student', []] } }
        }
      },
      { $sort: { totalStudents: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 1,
          username: 1,
          firstName: 1,
          lastName: 1,
          totalStudents: 1
        }
      }
    ]);

    // Total instructor revenue
    const totalInstructorRevenue = await Course.aggregate([
      { $match: { instructor: { $exists: true } } },
      { $unwind: '$enrollments' },
      { $group: { _id: null, totalRevenue: { $sum: '$enrollments.price' } } }
    ]);

    const kpiData = {
      totalActiveInstructors,
      pendingApplications,
      topInstructor: topInstructor[0] || null,
      totalInstructorRevenue: totalInstructorRevenue[0]?.totalRevenue || 0
    };

    console.log('KPI data:', kpiData);

    res.json(kpiData);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch instructor KPIs',
      error: error.message
    });
  }
};

// Assign courses to instructor
export const assignCoursesToInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { courseIds } = req.body;
    const adminId = req.user._id;

    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Update courses to assign to instructor
    const updatedCourses = await Course.updateMany(
      { _id: { $in: courseIds } },
      { instructor: instructorId }
    );

    // Log the action
    await AuditLog.create({
      action: 'assign_courses_to_instructor',
      performedBy: adminId,
      targetType: 'user',
      targetId: instructorId,
      details: { 
        instructorName: instructor.username, 
        courseIds,
        coursesAssigned: updatedCourses.modifiedCount
      }
    });

    res.json({
      message: 'Courses assigned successfully',
      coursesAssigned: updatedCourses.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to assign courses',
      error: error.message
    });
  }
};

// Update instructor payout settings
export const updateInstructorPayoutSettings = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { payoutPercentage, payoutMethod, payoutEmail } = req.body;
    const adminId = req.user._id;

    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Update payout settings
    instructor.payoutSettings = {
      percentage: payoutPercentage || instructor.payoutSettings?.percentage || 70,
      method: payoutMethod || instructor.payoutSettings?.method || 'bank_transfer',
      email: payoutEmail || instructor.payoutSettings?.email || instructor.email
    };

    await instructor.save();

    // Log the action
    await AuditLog.create({
      action: 'update_instructor_payout_settings',
      performedBy: adminId,
      targetType: 'user',
      targetId: instructorId,
      details: { 
        instructorName: instructor.username, 
        payoutPercentage,
        payoutMethod,
        payoutEmail
      }
    });

    res.json({
      message: 'Payout settings updated successfully',
      instructor
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update payout settings',
      error: error.message
    });
  }
};
