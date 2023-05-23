import * as mongoose from 'mongoose';

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
});

export const Department = mongoose.model('Department', departmentSchema);
