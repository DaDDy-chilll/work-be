const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { default: helmet } = require('helmet');

const { NODE_ENV } = require('./constants');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./helpers/apiError');

const { loadContainer } = require('./container');
// load container before the routes load
loadContainer();

const router = require('./routes');
const { getFileStream } = require('./lib/s3');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV !== 'production') {
  // app.use(morgan('dev'));
  app.use(
    morgan(function (tokens, req, res) {
      const object = {
        method: tokens.method(req, res),
        body: req.body,
        url: tokens.url(req, res),
        status: tokens.status(req, res),
      };

      return JSON.stringify(object, null, 2);
    })
  );
}

app.get(['/', '/api'], (req, res) => {
  res.send(`Parami Hostipal Budget Requisition API - ${NODE_ENV}`);
});

app.use('/api', router);

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
