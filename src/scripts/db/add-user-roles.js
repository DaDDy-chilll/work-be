/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../models/user.model');
const { MONGODB_URI, DB_NAME } = require('../../constants/app');
const { AUTHORIZED_DEPARTMENTS } = require('../../constants/user');

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const setSuperadmin = User.updateMany(
      { isSuperadmin: true },
      { role: 'SUPERADMIN' }
    );
    const setAuthorized = User.updateMany(
      { department: { $in: Object.values(AUTHORIZED_DEPARTMENTS) } },
      { role: 'AUTHORIZED' }
    );
    const setBasic = User.updateMany(
      {
        department: { $nin: Object.values(AUTHORIZED_DEPARTMENTS) },
        isSuperadmin: false,
      },
      {
        role: 'BASIC',
      }
    );

    await Promise.all([setSuperadmin, setAuthorized, setBasic]);
    mongoose.disconnect();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

run();
