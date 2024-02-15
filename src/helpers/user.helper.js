const ApiError = require('../utils/apiError');

module.exports = ({ User }) => {
  const findAndValidateUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.badRequest('user does not exist');
    }

    return user;
  };

  return Object.freeze({
    findAndValidateUser,
  });
};
