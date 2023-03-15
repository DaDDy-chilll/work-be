const { requestFormPermissions } = require('../constants');
const ApiError = require('../helpers/apiError');

const checkFormPermissions = (action) => {
  return (req, res, next) => {
    if (!requestFormPermissions.includes(action)) {
      return next(ApiError.badRequest('Invalid Permission.'));
    }
    if (!req.user) {
      return next(ApiError.notAuthenticated());
    }

    const requestFormPermission = req.user.permissions.requestForm;

    if (!requestFormPermission[action]) {
      return next(ApiError.notAuthorized('Not allowed.'));
    }

    next();
  };
};

module.exports = checkFormPermissions;
