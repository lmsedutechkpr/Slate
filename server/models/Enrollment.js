import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  progressPct: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastLectureId: {
    type: mongoose.Schema.Types.ObjectId
  },
  completedLectures: [{
    lectureId: String,
    completedAt: Date
  }],
  xp: {
    type: Number,
    default: 0
  },
  streakCount: {
    type: Number,
    default: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  certificateUrl: String
}, {
  timestamps: true
});

// Compound index for unique enrollment per student per course
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
