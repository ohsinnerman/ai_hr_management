import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const auditLogSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company' },
    userId: { type: ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g. 'EMPLOYEE_UPDATE', 'PAYROLL_APPROVE'
    entityType: { type: String, required: true }, // model name: 'Employee', 'Payslip', etc.
    entityId: ObjectId,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// CRITICAL: Make audit logs immutable at the schema level.
auditLogSchema.pre(
  ['updateOne', 'deleteOne', 'findOneAndUpdate', 'findOneAndDelete'],
  function () {
    throw new Error('AuditLog documents are immutable');
  }
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
