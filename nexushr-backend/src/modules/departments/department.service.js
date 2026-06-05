import Department from '../../models/Department.model.js';

const httpError = (status, code, message) => {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  return err;
};

export const create = async (companyId, data) => {
  return Department.create({
    companyId,
    name: data.name,
    code: data.code,
    parentId: data.parentId || null,
    headId: data.headId || null,
    isActive: data.isActive ?? true,
  });
};

export const getAll = async (companyId) => {
  return Department.find({ companyId, deletedAt: null })
    .populate('parentId', 'name code')
    .populate('headId', 'firstName lastName employeeCode')
    .sort({ createdAt: -1 })
    .lean();
};

export const update = async (companyId, id, data) => {
  const dept = await Department.findOneAndUpdate(
    { _id: id, companyId, deletedAt: null },
    {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.parentId !== undefined && { parentId: data.parentId || null }),
      ...(data.headId !== undefined && { headId: data.headId || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    { new: true }
  );
  if (!dept) throw httpError(404, 'NOT_FOUND', 'Department not found');
  return dept;
};

// Soft delete
export const remove = async (companyId, id) => {
  const dept = await Department.findOneAndUpdate(
    { _id: id, companyId, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  );
  if (!dept) throw httpError(404, 'NOT_FOUND', 'Department not found');
  return dept;
};
