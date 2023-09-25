const ApiError = require('../utils/apiError');

module.exports = (req, res, next) => {
  const user = req.user;

  if (!user.isSuperadmin) {
    return next(ApiError.notAuthorized());
  }

  next();
};
