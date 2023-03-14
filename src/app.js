const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const { NODE_ENV } = require('./constants');
const { default: helmet } = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.send('Hello world');
});

module.exports = app;
