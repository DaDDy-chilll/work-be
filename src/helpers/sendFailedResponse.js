const { NODE_ENV } = require('../constants');

function sendFailedResponse({ res, error }) {
  res.status(error.statusCode).json({
    code: error.statusCode,
    message: error.message,
    payload: error.data,
    ...(NODE_ENV === 'development' ? { stack: error.stack } : undefined),
  });
}

module.exports = sendFailedResponse;
