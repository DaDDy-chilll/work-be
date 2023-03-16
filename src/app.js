const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const { NODE_ENV } = require('./constants');
const { default: helmet } = require('helmet');
const errorHandler = require('./middlewares/errorHandler');

const authRouter = require('./routes/auth.route');
const documentRouter = require('./routes/document.route');
const ApiError = require('./helpers/apiError');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRouter);
app.use('/api/documents', documentRouter);

app.all('*', (req, res, next) => {
  next(ApiError.notFound());
});

app.use(errorHandler);

module.exports = app;
