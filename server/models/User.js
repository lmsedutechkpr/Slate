import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRoles } from '../constants.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: Object.values(UserRoles),
    default: UserRoles.STUDENT
  },
  googleEmail: {
    type: String,
    sparse: true
  },
  isGoogleLinked: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'banned', 'inactive'],
    default: 'active'
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    phone: String
  },
  studentProfile: {
    yearOfStudy: String,
    degree: String,
    interestType: String,
    domains: [String],
    careerGoal: String,
    learningPace: String,
    onboarded: { type: Boolean, default: false }
  },
  emailVerification: {
    pendingEmail: String,
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);
export default User;
