import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  joinedAt: Date,
  leftAt: Date,
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const liveSessionSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  startAt: {
    type: Date,
    required: true
  },
  endAt: {
    type: Date,
    required: true
  },
  joinLink: String,
  hostType: {
    type: String,
    enum: ['gmeet', 'zoom', 'youtube', 'internal'],
    default: 'internal'
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxParticipants: Number,
  notes: String,
  recordingUrl: String,
  isRecorded: {
    type: Boolean,
    default: false
  },
  attendance: [attendanceSchema],
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);
export default LiveSession;
