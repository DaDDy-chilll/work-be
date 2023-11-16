const ApiError = require('../../utils/apiError');

const checkCanForward = (user) => {
  if (!user.permissions.canForward && !user.isSuperadmin) {
    throw ApiError.notAuthorized('You are not authorized.');
  }
};

module.exports = {
  checkCanForward,
};
