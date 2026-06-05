import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const designationSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    level: Number,
    departmentId: { type: ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

designationSchema.index({ companyId: 1, isActive: 1 });

export default mongoose.model('Designation', designationSchema);
