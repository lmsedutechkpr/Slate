import { LiveSession, Enrollment } from '../models/index.js';

export const getMyLiveSessions = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({ studentId }).select('courseId');
    const courseIds = enrollments.map(e => e.courseId).filter(Boolean);
    if (courseIds.length === 0) return res.json({ sessions: [] });

    const now = new Date();
    const sessions = await LiveSession.find({
      courseId: { $in: courseIds },
      endAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
    })
      .populate('courseId', 'title')
      .populate('instructorId', 'username profile')
      .sort({ startAt: 1 })
      .limit(10);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get live sessions', error: error.message });
  }
};


