/* eslint-disable no-console */
const User = require('../../models/user.model');
const connectDb = require('./connectDb');

const DB_URI = 'HAHAHA';
const DB_NAME = 'ASDF';
const PASSWORD = 'LOVE';

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  const prevSuperadmin = await User.findOne({ isSuperadmin: true });

  if (prevSuperadmin) {
    await User.findByIdAndDelete(prevSuperadmin.id);
  }

  await User.create({
    email: 'superadmin@gmail.com',
    name: 'Superadmin',
    password: PASSWORD,
    role: 'SUPERADMIN',
    jobLabel: 'superadmin',
    isSuperadmin: true,
    department: 'Superadmin',
    permissions: {
      canApprove: true,
    },
  });

  console.log('Superadmin has been populated.');
});
