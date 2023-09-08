const ApiError = require('../helpers/apiError');

module.exports = (req, res, next) => {
  const user = req.user;

  if (!user.isSuperadmin) {
    return next(ApiError.notAuthorized());
  }

  next();
};
