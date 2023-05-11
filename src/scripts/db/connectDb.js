/* eslint-disable no-console */
const mongoose = require('mongoose');

module.exports = async function connectDb({ dbUri, dbName }, callback) {
  try {
    await mongoose.connect(dbUri, {
      dbName: dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await callback();

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
