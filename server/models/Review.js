import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, default: '' },
  },
  { timestamps: true }
);

ReviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

const Review = mongoose.model('Review', ReviewSchema);
export default Review;


