// Barrel that imports every model so Mongoose registers all schemas at startup.
// This guarantees `ref`/`populate` works regardless of import order.
import Company from './Company.model.js';
import User from './User.model.js';
import Department from './Department.model.js';
import Designation from './Designation.model.js';
import Employee from './Employee.model.js';

export { Company, User, Department, Designation, Employee };
