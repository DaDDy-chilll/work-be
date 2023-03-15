const { userRoles } = require('../constants');
const ApiError = require('../helpers/apiError');

const checkSuperadmin = (req, res, next) => {
  if (req.user.role !== userRoles.superadmin) {
    return next(ApiError.notAuthorized());
  }

  next();
};

module.exports = checkSuperadmin;
