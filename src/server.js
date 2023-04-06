/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { PORT, MONGODB_URI, DB_NAME } = require('./constants');

async function connectToDatabase() {
  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB.');
  } catch (error) {
    console.log('Error while connecting to MongoDB');
    console.error(error);
  }
}

async function main() {
  await connectToDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.log('UnhandledRejection occurred.');
    console.log(err);
    server.close(() => {
      process.exit(1);
    });
  });
}

main();
