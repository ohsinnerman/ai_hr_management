import AttendanceRecord from '../../models/AttendanceRecord.model.js';
import Company from '../../models/Company.model.js';
import { midnightUTC, cutoffOn } from '../../utils/dates.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

const STANDARD_WORKDAY_HOURS = 9; // includes breaks (per Phase 3 spec)

/**
 * Check in for today. Lateness is derived from the Company's
 * settings.attendanceCutoffTime (no Shift model is used).
 */
export const checkIn = async (employeeId, companyId, location) => {
  const now = new Date();
  const today = midnightUTC(now);

  // Reject a second check-in for the same day.
  const existing = await AttendanceRecord.findOne({ employeeId, date: today });
  if (existing && existing.checkInTime) {
    throw httpError(409, 'ALREADY_CHECKED_IN', 'You have already checked in today');
  }

  const company = await Company.findById(companyId).lean();
  const cutoff = cutoffOn(company?.settings?.attendanceCutoffTime, now);
  const isLate = now > cutoff;
  const lateByMinutes = isLate ? Math.floor((now - cutoff) / 60000) : 0;

  const record = await AttendanceRecord.findOneAndUpdate(
    { employeeId, date: today },
    {
      checkInTime: now,
      status: 'present',
      isLate,
      lateByMinutes,
      ...(location && { checkInLocation: location }),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return record;
};

/**
 * Check out for today. Computes workingHours and overtime against a 9h workday.
 */
export const checkOut = async (employeeId, location) => {
  const today = midnightUTC();
  const record = await AttendanceRecord.findOne({ employeeId, date: today });

  if (!record || !record.checkInTime) {
    throw httpError(400, 'NOT_CHECKED_IN', 'No check-in found for today');
  }
  if (record.checkOutTime) {
    throw httpError(409, 'ALREADY_CHECKED_OUT', 'You have already checked out today');
  }

  const now = new Date();
  const workingHours = (now - record.checkInTime) / 3600000;
  const overtimeHours = Math.max(0, workingHours - STANDARD_WORKDAY_HOURS);

  record.checkOutTime = now;
  record.workingHours = Number(workingHours.toFixed(2));
  record.overtimeHours = Number(overtimeHours.toFixed(2));
  if (location) record.checkOutLocation = location;
  await record.save();

  return record;
};

/**
 * All attendance records for an employee within a given month/year
 * (defaults to the current month).
 */
export const getAttendance = async (employeeId, month, year) => {
  const now = new Date();
  const y = Number(year) || now.getUTCFullYear();
  const m = month ? Number(month) - 1 : now.getUTCMonth(); // month is 1-12 on input

  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));

  return AttendanceRecord.find({ employeeId, date: { $gte: start, $lt: end } })
    .sort({ date: 1 })
    .lean();
};
