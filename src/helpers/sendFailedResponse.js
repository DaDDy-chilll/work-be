function sendFailedResponse({ res, error }) {
  res.status(error.statusCode).json({
    code: statusCode,
    message: error.message,
    data: error.data,
  });
}

module.exports = sendFailedResponse;
