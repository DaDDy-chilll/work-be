function sendSuccessResponse({
  res,
  data = null,
  message = 'OK',
  code = 200,
  total = 0,
}) {
  res.status(code).json({
    code,
    data,
    message,
    total,
  });
}

module.exports = sendSuccessResponse;
