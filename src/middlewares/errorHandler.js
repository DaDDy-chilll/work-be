/* eslint-disable no-console */
const multer = require('multer');
const { NODE_ENV } = require('../constants');
const ApiError = require('../utils/apiError');
const sendFailedResponse = require('../utils/sendFailedResponse');
const Logger = require('../logger');

function errorHandler(error, req, res, next) {
  const logger = new Logger('error-handler');
  if (NODE_ENV !== 'production') {
    logger.debug(error);
  }

  if (error instanceof ApiError) {
    sendFailedResponse({ res, error });
  } else if (error instanceof multer.MulterError) {
    sendFailedResponse({
      res,
      error: ApiError.badRequest('There was an error while uploading files.'),
    });
  } else {
    logger.error(error.message, error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error.',
      data: null,
    });
  }
}

module.exports = errorHandler;
