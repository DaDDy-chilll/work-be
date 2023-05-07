const ApiError = require('../helpers/apiError');
const { verifyPassword, signToken } = require('./utils/auth.utils');

module.exports = ({ User }) => {
  const _noUserError = ApiError.badRequest('User does not exist.');

  const getUserByEmail = async (email) => {
    const user = await User.findOne({ email });

    return user;
  };

  const register = async (data) => {
    const user = await User.create(data);
    user.password = undefined;

    return user;
  };

  const login = async ({ email, password }) => {
    const loginError = ApiError.badRequest('Wrong credentials.');
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw loginError;
    }

    const isCorrectPassword = await verifyPassword({
      plainText: password,
      encrypted: user.password,
    });

    if (!isCorrectPassword) {
      throw loginError;
    }

    user.password = undefined;

    const token = await signToken({ payload: { userId: user._id } });

    return { user, accessToken: token };
  };

  const updatePassword = async ({ id, newPassword }) => {
    const user = await User.findById(id).select('+password');

    if (!user) {
      throw _noUserError;
    }

    user.password = newPassword;

    await user.save();
    user.password = undefined;

    return user;
  };

  return {
    getUserByEmail,
    register,
    login,
    updatePassword,
  };
};
