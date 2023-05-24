import * as mongoose from 'mongoose';

import createCustomIdMiddleware from '../helpers/model-customId-middleware.helper';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  isStartingDepartment: {
    type: Boolean,
    default: false,
  },
  departmentId: {
    type: String,
    unique: true,
    required: true,
  },
});

departmentSchema.pre(
  'validate' as any,
  createCustomIdMiddleware({
    modelName: 'Department',
    prefix: 'DP',
    fieldName: 'departmentId',
  }) as any
);

export const Department = mongoose.model('Department', departmentSchema);
