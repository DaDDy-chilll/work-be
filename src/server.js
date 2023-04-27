/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { PORT, MONGODB_URI, DB_NAME } = require('./constants');
const envSchema = require('./schema/env.schema');
const { ZodError } = require('zod');

function validateEnvVariables() {
  try {
    const runTime = process.env;
    envSchema.parse(runTime);
    console.log('Env variables validation completed.');
  } catch (error) {
    console.log('Env variables validation failed.');
    if (error instanceof ZodError) {
      console.log('Missing/Invalid variables:');
      console.log('##########################');

      error.errors.forEach(({ path }, idx) =>
        console.log(`${idx + 1}. ${path[0]}`)
      );
    }
    process.exit(1);
  }
}

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
  validateEnvVariables();
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
