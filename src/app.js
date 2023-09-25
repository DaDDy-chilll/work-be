const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./logger');
const cors = require('cors');
const { default: helmet } = require('helmet');

const { NODE_ENV } = require('./constants');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/apiError');

const { loadContainer } = require('./container');
// load container before the routes load
loadContainer();

const router = require('./routes');
const { getFileStream } = require('./lib/s3');

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan(
    function (tokens, req, res) {
      const object = {
        method: tokens.method(req, res),
        body: req.body,
        base_url: req.baseUrl,
        params: req.params,
        query: req.query,
        res_status: tokens.status(req, res),
        ip: req.ip,
        response_time: `${tokens['response-time'](req, res)}ms`,
        user_agent: req.get('user-agent'),
        user_id: req.user?.id,
        hostname: req.hostname,
      };

      return JSON.stringify(object);
    },
    { stream: logger.stream }
  )
);

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
