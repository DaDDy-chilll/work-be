const connectDb = require('./connectDb');
const User = require('../../models/user.model');

const DB_URI =
  'mongodb+srv://marco:XxJGeytqcFIBGmMo@cluster0.wkpxthm.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'parami-requisition-management';
const PASSWORD = 'paramisuperadmin';

connectDb({ dbUri: DB_URI, dbName: DB_NAME }, async () => {
  const superadmin = await User.findOne({ isSuperadmin: true });

  if (!superadmin) {
    throw new Error('Superadmin does not exist.');
  }

  await User.findByIdAndUpdate(superadmin.id, {
    password: PASSWORD,
  });

  console.log("Superadmin's password has been changed.");
});
