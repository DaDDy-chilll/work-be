function sendSuccessResponse({ res, data = null, message = 'OK', code = 200 }) {
  res.status(code).json({
    code,
    data,
    message,
  });
}

module.exports = sendSuccessResponse;
