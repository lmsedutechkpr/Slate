import { User, Course, Enrollment } from '../models/index.js';

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

    // Placeholder values for fields we don't track yet
    const totalRevenue = 0;
    const monthlyGrowth = 0;

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


