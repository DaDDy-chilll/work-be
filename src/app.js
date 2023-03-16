const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { default: helmet } = require('helmet');

const { NODE_ENV } = require('./constants');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./helpers/apiError');

const authRouter = require('./routes/auth.route');
const documentRouter = require('./routes/document.route');
const userRouter = require('./routes/user.route');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRouter);
app.use('/api/documents', documentRouter);
app.use('/api/users', userRouter);

app.all('*', (req, res, next) => {
  next(ApiError.notFound());
});

app.use(errorHandler);

module.exports = app;
