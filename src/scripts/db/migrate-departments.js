require('dotenv').config('./.env');
const connectDb = require('./connectDb');
const User = require('../../models/user.model');
const Department = require('../../models/department.model');

const DB_URI = process.env.MONGODB_URI;
const DB_NAME = 'local-parami-requisition-management';

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  const users = await User.find();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    const department = await Department.findOneAndUpdate(
      { name: user.department },
      { name: user.department },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(user.id, { department: department.id });
  }

  console.log('Users are updated with new departments.');
});
