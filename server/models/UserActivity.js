import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: { type: String, enum: ['login', 'quiz_attempt', 'watch_time'], required: true },
  meta: { type: Map, of: mongoose.Schema.Types.Mixed },
  value: { type: Number, default: 0 }, // e.g., seconds watched, quiz score, etc.
  occurredAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

userActivitySchema.index({ type: 1, occurredAt: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
export default UserActivity;


