/* eslint-disable no-console */
const { NODE_ENV } = require('../constants');
const ApiError = require('../helpers/apiError');
const sendFailedResponse = require('../helpers/sendFailedResponse');

function errorHandler(error, req, res, next) {
  if (NODE_ENV !== 'production') {
    console.log(error);
  }

  if (error instanceof ApiError) {
    sendFailedResponse({ res, error });
  } else {
    res.json({
      code: 500,
      message: 'Internal server error.',
      data: null,
    });
  }
}

module.exports = errorHandler;
