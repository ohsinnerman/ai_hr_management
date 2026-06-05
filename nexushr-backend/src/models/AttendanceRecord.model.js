import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const locationSchema = new mongoose.Schema(
  { lat: Number, lng: Number, address: String },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true }, // Store at midnight UTC: new Date(dateString)
    checkInTime: Date,
    checkOutTime: Date,
    checkInLocation: locationSchema,
    checkOutLocation: locationSchema,
    workingHours: { type: Number, default: 0 }, // (checkOut - checkIn) / 3600000
    overtimeHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'holiday', 'weekend', 'on_leave'],
      default: 'absent',
    },
    isLate: { type: Boolean, default: false },
    lateByMinutes: { type: Number, default: 0 },
    notes: String,
    approvedBy: { type: ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model('AttendanceRecord', attendanceSchema);
