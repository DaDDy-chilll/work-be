const ApiError = require('../utils/apiError');
const { verifyPassword, signToken } = require('./utils/auth.utils');
const { AUTHORIZED_DEPARTMENTS } = require('../constants/user');

/**
 * @typedef {Object} Dependencies
 * @property {typeof import('../models/user.model')} User
 * @property {ReturnType<typeof import('../services/user.service')>} userService
 *
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ User, userService }) => {
  const _noUserError = ApiError.badRequest('User does not exist.');

  const getUserByEmail = async (email) => {
    const user = await User.findOne({ email });

    return user;
  };

  const register = async (data) => {
    if (data.permissions?.canApprove) {
      const userWithApprovePermission = await User.findOne({
        'permissions.canApprove': true,
        department: data.department,
      });

      if (userWithApprovePermission) {
        throw ApiError.badRequest(
          "There's already one person with approve permission."
        );
      }
    }

    const user = await userService.createUser(data);

    return user;
  };

  const login = async ({ email, password }) => {
    const loginError = ApiError.badRequest('Wrong credentials.');
    const user = await User.findOne({ email, isDisabled: false }).select(
      '+password'
    );

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

  const updatePassword = async ({ userId, password }) => {
    const user = await User.findOne({ _id: userId, isDisabled: false });

    if (!user) {
      throw _noUserError;
    }

    user.password = password;

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
