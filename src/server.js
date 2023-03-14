require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { PORT, MONGODB_URI, DB_NAME } = require('./constants');

mongoose.set('strictQuery', false);

mongoose
  .connect(MONGODB_URI, {
    dbName: DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB Error: ', error);
  });

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
