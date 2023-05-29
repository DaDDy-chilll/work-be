require('dotenv').config('./.env');
const connectDb = require('./connectDb');
const User = require('../../models/user.model');
const { default: mongoose } = require('mongoose');

const DB_URI = process.env.MONGODB_URI;
const DB_NAME = 'local-parami-requisition-management';

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  const users = await User.find();

  await Promise.all(
    users.map((user) => {
      return User.findByIdAndUpdate(user.id, {
        department: new mongoose.Types.ObjectId(user.department),
      });
    })
  );

  console.log("Users' departments are converted to ObjectId.");
});
