import mongoose from 'mongoose';
import { AssignmentStatus } from '../constants.js';

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [String],
  text: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  score: Number,
  maxScore: Number,
  feedback: String,
  status: {
    type: String,
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.SUBMITTED
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: Date
});

const assignmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueAt: {
    type: Date,
    required: true
  },
  maxScore: {
    type: Number,
    default: 100
  },
  resources: [String],
  instructions: String,
  submissions: [submissionSchema],
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
