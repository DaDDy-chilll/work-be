require('dotenv').config('./.env');
const mongoose = require('mongoose');
const connectDb = require('./connectDb');
const User = require('../../models/user.model');
const { Department } = require('../../models/department.model');

const DB_URI = process.env.MONGODB_URI;
const DB_NAME = 'hello';

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  const users = await User.find();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    const departmentName = user.isSuperadmin ? 'SUPERADMIN' : user.department;

    let department = await Department.findOne({ name: departmentName });

    if (!department) {
      department = await Department.create({ name: departmentName });
    }

    const departmentId = new mongoose.Types.ObjectId(department._id);

    await User.findByIdAndUpdate(user.id, {
      department: departmentId,
    });
  }

  console.log('Users are updated with new departments.');
});
