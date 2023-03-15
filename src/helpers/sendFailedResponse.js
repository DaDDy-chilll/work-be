const { NODE_ENV } = require('../constants');

function sendFailedResponse({ res, error }) {
  res.status(error.statusCode).json({
    code: error.statusCode,
    message: error.message,
    data: error.data,
    ...(NODE_ENV !== 'production' ? { stack: error.stack } : undefined),
  });
}

module.exports = sendFailedResponse;
