import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'hr_manager', 'recruiter', 'senior_manager', 'employee'],
      default: 'employee',
    },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    refreshTokenHash: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

// Virtual: account lock state
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// NOTE (per Phase 1 prompt): password is hashed in auth.service.js, NOT in a pre-save hook.
userSchema.methods.comparePassword = async function (p) {
  return bcryptjs.compare(p, this.passwordHash);
};

userSchema.index({ companyId: 1, isActive: 1 });

export default mongoose.model('User', userSchema);
