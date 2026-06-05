import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const departmentSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    code: { type: String, uppercase: true },
    parentId: { type: ObjectId, ref: 'Department' }, // self-reference for sub-departments
    headId: { type: ObjectId, ref: 'Employee' },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

departmentSchema.index({ companyId: 1, isActive: 1 });

export default mongoose.model('Department', departmentSchema);
