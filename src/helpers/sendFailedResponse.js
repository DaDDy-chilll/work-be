const { NODE_ENV } = require('../constants');

function sendFailedResponse({ res, error }) {
  if (NODE_ENV !== 'production') {
    console.log(error);
  }

  res.status(error.statusCode).json({
    code: statusCode,
    message: error.message,
    data: error.data,
    ...(NODE_ENV !== 'production' ? { stack: error.stack } : undefined),
  });
}

module.exports = sendFailedResponse;
