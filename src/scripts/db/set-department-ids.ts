import dotenv from 'dotenv';

dotenv.config();

import connectDb from './connectDb';
import { Department } from '../../models/department.model';

const DB_NAME = 'HELLO WORLD';
const DB_URI = process.env.MONGODB_URI as string;

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  const departments = await Department.find().sort({ $natural: 'asc' });

  for (let i = 0; i < departments.length; i++) {
    await Department.findByIdAndUpdate(departments[i]._id, {
      departmentId: `DP-${i + 1}`,
    });
  }
  console.log('Departments have been given custom ids.');
});
