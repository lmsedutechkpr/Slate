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

// List live sessions for the authenticated instructor's courses
export const getInstructorLiveSessions = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const sessions = await LiveSession.find({ instructorId })
      .populate('courseId', 'title')
      .sort({ startAt: -1 })
      .limit(50);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch instructor live sessions', error: error.message });
  }
};

export const createInstructorLiveSession = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { courseId, title, description, startAt, endAt, hostType, joinLink, maxParticipants } = req.body;

    if (!courseId || !title || !startAt || !endAt) {
      return res.status(400).json({ message: 'courseId, title, startAt and endAt are required' });
    }

    const session = new LiveSession({
      courseId,
      title,
      description: description || '',
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      hostType: hostType || 'internal',
      joinLink: joinLink || '',
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      instructorId,
      status: 'scheduled'
    });
    await session.save();
    res.status(201).json({ message: 'Live session created', session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create live session', error: error.message });
  }
};

export const updateInstructorLiveSession = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { sessionId } = req.params;
    const update = { ...req.body };
    if (update.startAt) update.startAt = new Date(update.startAt);
    if (update.endAt) update.endAt = new Date(update.endAt);

    const session = await LiveSession.findOneAndUpdate(
      { _id: sessionId, instructorId },
      { $set: update },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Live session updated', session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update live session', error: error.message });
  }
};

export const deleteInstructorLiveSession = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { sessionId } = req.params;
    const deleted = await LiveSession.findOneAndDelete({ _id: sessionId, instructorId });
    if (!deleted) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Live session deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete live session', error: error.message });
  }
};


