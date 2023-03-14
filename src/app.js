const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const { NODE_ENV } = require('./constants');
const { default: helmet } = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const sendSuccessResponse = require('./helpers/sendSuccessResponse');

const app = express();

app.use(cors());
app.use(helmet());

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.all('*', (req, res) => {
  sendSuccessResponse({ res, message: 'Invalid endpoint.', code: 404 });
});

app.use(errorHandler);

module.exports = app;
