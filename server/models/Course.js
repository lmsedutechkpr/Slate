import mongoose from 'mongoose';
import { CourseLevel } from '../constants.js';

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  videoUrl: String,
  youtubeId: String,
  durationSec: Number,
  resources: [String],
  order: {
    type: Number,
    default: 0
  }
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  lectures: [lectureSchema]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: String,
  tags: [String],
  level: {
    type: String,
    enum: Object.values(CourseLevel),
    default: CourseLevel.BEGINNER
  },
  language: {
    type: String,
    default: 'English'
  },
  coverUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedInstructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sections: [sectionSchema],
  isPublished: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  estimatedHours: Number,
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Generate slug before saving
courseSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
