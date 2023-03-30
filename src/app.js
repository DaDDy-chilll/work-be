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
const { getFileStream } = require('./lib/s3');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/', (req, res) => {
  res.send(`Parami Hostipal Budget Requisition API - ${NODE_ENV}`);
});

app.use('/api/auth', authRouter);
app.use('/api/documents', documentRouter);
app.use('/api/users', userRouter);

app.get(
  '/images/:key',
  cors({
    origin: '*',
  }),
  async (req, res) => {
    try {
      const key = req.params.key;
      const fileStream = await getFileStream(key);

      fileStream.pipe(res);
    } catch (error) {
      res.status(404).send();
    }
  }
);

app.all('*', (req, res, next) => {
  next(ApiError.notFound());
});

app.use(errorHandler);

module.exports = app;
