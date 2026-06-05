import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import Employee from '../../models/Employee.model.js';
import User from '../../models/User.model.js';
import Payslip from '../../models/Payslip.model.js';
import { encrypt, decrypt, maskSensitive } from '../../utils/crypto.js';
import { getSignedDownloadUrl, keyFromUrl } from '../../utils/s3Upload.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

// Fields a client may set on create/update (whitelist — never trust raw body).
const WRITABLE_FIELDS = [
  'departmentId', 'designationId', 'managerId',
  'firstName', 'lastName', 'email', 'personalEmail', 'phone',
  'dateOfBirth', 'gender', 'maritalStatus', 'nationality',
  'address', 'emergencyContact',
  'dateJoined', 'dateLeft', 'employmentType', 'employmentStatus', 'probationEndDate',
  'bankDetails', 'panNumber', 'aadhaarNumber',
  'profilePhotoUrl', 'customFields', 'onboardingCompleted',
];

const PII_FIELDS = ['bankDetails', 'panNumber', 'aadhaarNumber'];

const pickWritable = (data = {}) => {
  const out = {};
  for (const key of WRITABLE_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  if (out.email) out.email = String(out.email).toLowerCase();
  return out;
};

// Encrypt PII fields in-place (only those actually present).
const encryptPii = (obj) => {
  for (const field of PII_FIELDS) {
    if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
      obj[field] = encrypt(obj[field]);
    }
  }
};

// Decrypt + mask PII for a single-employee response (proves round-trip without over-exposing).
const decryptForResponse = (empDoc) => {
  const obj = empDoc?.toObject ? empDoc.toObject() : empDoc;
  if (!obj) return obj;
  if (obj.panNumber) obj.panNumber = maskSensitive(decrypt(obj.panNumber));
  if (obj.aadhaarNumber) obj.aadhaarNumber = maskSensitive(decrypt(obj.aadhaarNumber));
  if (obj.bankDetails) {
    const plain = decrypt(obj.bankDetails);
    try {
      obj.bankDetails = JSON.parse(plain);
    } catch {
      obj.bankDetails = plain;
    }
  }
  return obj;
};

// Next sequential code (global, matching the unique index on employeeCode): EMP-0001, EMP-0002…
const generateEmployeeCode = async () => {
  const last = await Employee.findOne({ employeeCode: { $regex: /^EMP-\d+$/ } })
    .sort({ employeeCode: -1 })
    .select('employeeCode')
    .lean();
  let next = 1;
  if (last) {
    const m = last.employeeCode.match(/(\d+)$/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return 'EMP-' + String(next).padStart(4, '0');
};

const generateTempPassword = () =>
  // URL-safe ~12 chars; satisfies the >=6 login rule and gives a usable temp credential.
  crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) + '@1';

/**
 * Paginated + filterable employee list, scoped to the caller's company.
 * PII fields are excluded from list responses (data minimization).
 */
export const getAll = async ({ companyId, page = 1, perPage = 25, department, status, search }) => {
  const query = { companyId, deletedAt: null };
  if (department) query.departmentId = department;
  if (status) query.employmentStatus = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeCode: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Number(page) || 1;
  const limit = Number(perPage) || 25;
  const skip = (pageNum - 1) * limit;

  const [employees, total] = await Promise.all([
    Employee.find(query)
      .select('-bankDetails -panNumber -aadhaarNumber')
      .populate('departmentId designationId managerId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Employee.countDocuments(query),
  ]);

  return {
    employees,
    meta: { page: pageNum, perPage: limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Single employee with relations populated; PII decrypted + masked.
 */
export const getById = async (companyId, id) => {
  const employee = await Employee.findOne({ _id: id, companyId, deletedAt: null })
    .populate('departmentId designationId managerId')
    .populate('userId', 'email role isActive');
  if (!employee) throw httpError(404, 'NOT_FOUND', 'Employee not found');
  return decryptForResponse(employee);
};

/**
 * Manager chain (upward) + direct reports for an employee.
 */
export const getOrgTree = async (companyId, employeeId) => {
  const employee = await Employee.findOne({ _id: employeeId, companyId, deletedAt: null })
    .populate('managerId', 'firstName lastName employeeCode designationId')
    .populate('designationId', 'name level');
  if (!employee) throw httpError(404, 'NOT_FOUND', 'Employee not found');

  const directReports = await Employee.find({ managerId: employeeId, deletedAt: null })
    .select('firstName lastName employeeCode designationId managerId')
    .populate('designationId', 'name level')
    .lean();

  // Walk up the manager chain (guard against cycles).
  const managerChain = [];
  const seen = new Set([String(employeeId)]);
  let current = employee.managerId;
  while (current) {
    if (seen.has(String(current._id))) break; // cycle protection
    seen.add(String(current._id));
    managerChain.push(current);
    current = await Employee.findById(current.managerId)
      .select('firstName lastName employeeCode managerId designationId')
      .populate('designationId', 'name level');
  }

  return { employee, managerChain, directReports };
};

/**
 * Create an employee:
 *  - generates the next sequential employeeCode
 *  - optionally provisions a linked User (role 'employee') with a temp password
 *  - encrypts PII (bankDetails, panNumber, aadhaarNumber) before saving
 */
export const createEmployee = async ({ companyId, createdBy, data, provisionUser = true }) => {
  const fields = pickWritable(data);
  encryptPii(fields);

  const employeeCode = data.employeeCode || (await generateEmployeeCode());

  let createdUser = null;
  let temporaryPassword = null;

  try {
    if (provisionUser) {
      if (!fields.email) throw httpError(400, 'VALIDATION_ERROR', 'email is required to provision a user account');
      temporaryPassword = generateTempPassword();
      const passwordHash = await bcryptjs.hash(temporaryPassword, 12);
      createdUser = await User.create({
        companyId,
        email: fields.email,
        passwordHash,
        role: 'employee',
      });
    }

    const employee = await Employee.create({
      ...fields,
      companyId,
      employeeCode,
      userId: createdUser?._id,
      createdBy,
    });

    const populated = await employee.populate('departmentId designationId managerId');
    return { employee: decryptForResponse(populated), temporaryPassword };
  } catch (err) {
    // Roll back the user we just created so we don't leave an orphan.
    if (createdUser) await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'value';
      throw httpError(409, 'CONFLICT', `An entry with this ${field} already exists`);
    }
    throw err;
  }
};

/**
 * Partial update; re-encrypts PII when those fields are provided.
 */
export const updateEmployee = async ({ companyId, id, updatedBy, data }) => {
  const fields = pickWritable(data);
  encryptPii(fields);
  fields.updatedBy = updatedBy;

  const employee = await Employee.findOneAndUpdate(
    { _id: id, companyId, deletedAt: null },
    fields,
    { new: true, runValidators: true }
  ).populate('departmentId designationId managerId');

  if (!employee) throw httpError(404, 'NOT_FOUND', 'Employee not found');
  return decryptForResponse(employee);
};

/**
 * Soft delete: stamp deletedAt and deactivate the linked user account.
 */
export const softDelete = async (companyId, id) => {
  const employee = await Employee.findOneAndUpdate(
    { _id: id, companyId, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!employee) throw httpError(404, 'NOT_FOUND', 'Employee not found');

  if (employee.userId) {
    await User.updateOne({ _id: employee.userId }, { isActive: false }).catch(() => {});
  }
  return employee;
};

// ── Self-service (Phase 6) ─────────────────────────────────

// Fully decrypt PII for the employee viewing their OWN record (no masking).
const decryptFull = (empDoc) => {
  const obj = empDoc?.toObject ? empDoc.toObject() : empDoc;
  if (!obj) return obj;
  if (obj.panNumber) obj.panNumber = decrypt(obj.panNumber);
  if (obj.aadhaarNumber) obj.aadhaarNumber = decrypt(obj.aadhaarNumber);
  if (obj.bankDetails) {
    const plain = decrypt(obj.bankDetails);
    try {
      obj.bankDetails = JSON.parse(plain);
    } catch {
      obj.bankDetails = plain;
    }
  }
  return obj;
};

// Resolve the Employee linked to a user, or 404.
const requireOwnEmployee = async (userId) => {
  const employee = await Employee.findOne({ userId, deletedAt: null });
  if (!employee) throw httpError(404, 'EMPLOYEE_NOT_FOUND', 'No employee record is linked to this user');
  return employee;
};

/**
 * The caller's own profile with PII fully decrypted (PAN/Aadhaar plaintext,
 * bankDetails parsed back to JSON). Only ever used for the `me` endpoint.
 */
export const getSelfProfile = async (userId) => {
  const employee = await Employee.findOne({ userId, deletedAt: null }).populate(
    'departmentId designationId managerId'
  );
  if (!employee) throw httpError(404, 'EMPLOYEE_NOT_FOUND', 'No employee record is linked to this user');
  return decryptFull(employee);
};

/**
 * The caller's own PUBLISHED payslips, newest first, with the run period populated.
 */
export const getSelfPayslips = async (userId) => {
  const employee = await requireOwnEmployee(userId);
  return Payslip.find({ employeeId: employee._id, isPublished: true })
    .populate('payrollRunId', 'periodStart periodEnd status runDate')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * A time-limited signed URL to download one of the caller's own published payslips.
 */
export const getSelfPayslipDownloadUrl = async (userId, payslipId) => {
  const employee = await requireOwnEmployee(userId);
  const payslip = await Payslip.findOne({ _id: payslipId, employeeId: employee._id, isPublished: true });
  if (!payslip) throw httpError(404, 'NOT_FOUND', 'Payslip not found');
  if (!payslip.pdfUrl) throw httpError(404, 'PDF_UNAVAILABLE', 'No PDF is available for this payslip');

  const key = keyFromUrl(payslip.pdfUrl);
  const url = await getSignedDownloadUrl(key, 3600);
  return { url, expiresIn: 3600 };
};
