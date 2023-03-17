const { userRoles } = require('../constants');
const ApiError = require('../helpers/apiError');

const authorize = (roles = Object.values(userRoles)) => {
  return (req, res, next) => {
    const user = req.user;

    if (!roles.includes(user.role)) {
      return next(ApiError.notAuthorized());
    }

    next();
  };
};

module.exports = authorize;
