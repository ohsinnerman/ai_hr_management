import Designation from '../../models/Designation.model.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

export const create = async (companyId, data) => {
  return Designation.create({
    companyId,
    name: data.name,
    level: data.level,
    departmentId: data.departmentId || null,
    isActive: data.isActive ?? true,
  });
};

export const getAll = async (companyId) => {
  return Designation.find({ companyId, isActive: true })
    .populate('departmentId', 'name code')
    .sort({ level: 1, createdAt: -1 })
    .lean();
};

export const update = async (companyId, id, data) => {
  const desig = await Designation.findOneAndUpdate(
    { _id: id, companyId },
    {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.level !== undefined && { level: data.level }),
      ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    { new: true }
  );
  if (!desig) throw httpError(404, 'NOT_FOUND', 'Designation not found');
  return desig;
};

// Soft delete (Designation has no deletedAt field — deactivate instead)
export const remove = async (companyId, id) => {
  const desig = await Designation.findOneAndUpdate(
    { _id: id, companyId },
    { isActive: false },
    { new: true }
  );
  if (!desig) throw httpError(404, 'NOT_FOUND', 'Designation not found');
  return desig;
};
