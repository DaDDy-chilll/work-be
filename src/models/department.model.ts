import * as mongoose from 'mongoose';

import createCustomIdMiddleware from '../helpers/model-customId-middleware.helper';

const departmentSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: ['normal', 'authorized', 'superadmin'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.pre(
  'validate',
  createCustomIdMiddleware({
    modelName: 'Department',
    prefix: 'DP',
    fieldName: 'departmentId',
  }) as unknown as mongoose.PreMiddlewareFunction
);

export const Department = mongoose.model('Department', departmentSchema);
