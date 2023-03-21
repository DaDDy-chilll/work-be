/* eslint-disable no-console */
const multer = require('multer');
const { NODE_ENV } = require('../constants');
const ApiError = require('../helpers/apiError');
const sendFailedResponse = require('../helpers/sendFailedResponse');

function errorHandler(error, req, res, next) {
  if (NODE_ENV !== 'production') {
    console.log(error);
  }

  if (error instanceof ApiError) {
    sendFailedResponse({ res, error });
  } else if (error instanceof multer.MulterError) {
    sendFailedResponse({
      res,
      error: ApiError.badRequest('There was an error while uploading files.'),
    });
  } else {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: 'Internal server error.',
      data: null,
    });
  }
}

module.exports = errorHandler;
