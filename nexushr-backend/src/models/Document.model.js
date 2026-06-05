import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const documentSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    employeeId: { type: ObjectId, ref: 'Employee' }, // null = company-wide policy
    title: { type: String, required: true },
    fileUrl: { type: String, required: true }, // S3/R2 object key or full URL
    fileType: String, // 'pdf' | 'docx' | 'txt'
    fileSizeBytes: Number,
    category: {
      type: String,
      enum: ['contract', 'policy', 'certificate', 'payslip', 'compliance', 'other'],
      default: 'other',
    },
    isConfidential: { type: Boolean, default: false }, // BR-009: hidden from non-HR
    contentText: String, // extracted raw text (plain string)
    embedding: [Number], // 768-dim Gemini text-embedding-004 vector
    version: { type: Number, default: 1 },
    expiresAt: Date,
    uploadedBy: { type: ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

documentSchema.index({ companyId: 1, category: 1 });
documentSchema.index({ companyId: 1, deletedAt: 1 });

export default mongoose.model('Document', documentSchema);
