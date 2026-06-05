import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const addressSchema = new mongoose.Schema(
  { line1: String, line2: String, city: String, state: String, country: String, zip: String },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  { name: String, relation: String, phone: String, email: String },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    employeeCode: { type: String, required: true, unique: true }, // e.g., "EMP-0001"
    userId: { type: ObjectId, ref: 'User', unique: true, sparse: true },
    departmentId: { type: ObjectId, ref: 'Department' },
    designationId: { type: ObjectId, ref: 'Designation' },
    managerId: { type: ObjectId, ref: 'Employee' }, // self-reference
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    personalEmail: String,
    phone: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'] },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    nationality: String,
    address: addressSchema,
    emergencyContact: emergencyContactSchema,
    dateJoined: { type: Date, required: true },
    dateLeft: Date,
    employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], default: 'full_time' },
    employmentStatus: { type: String, enum: ['active', 'on_leave', 'suspended', 'terminated'], default: 'active' },
    probationEndDate: Date,
    bankDetails: String, // AES-256 encrypted JSON string (encrypt before save)
    panNumber: String, // AES-256 encrypted
    aadhaarNumber: String, // AES-256 encrypted
    profilePhotoUrl: String,
    customFields: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    onboardingCompleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual('fullName').get(function () {
  return this.firstName + ' ' + this.lastName;
});

employeeSchema.index({ companyId: 1, employmentStatus: 1 });
employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ managerId: 1 });

export default mongoose.model('Employee', employeeSchema);
