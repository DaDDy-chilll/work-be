const ApiError = require('../helpers/apiError');
const { verifyPassword, signToken } = require('./utils/auth.utils');
const { AUTHORIZED_DEPARTMENTS } = require('../constants/user');

module.exports = ({ User, userService }) => {
  const _noUserError = ApiError.badRequest('User does not exist.');

  const getUserByEmail = async (email) => {
    const user = await User.findOne({ email });

    return user;
  };

  const register = async (data) => {
    let role;
    if (Object.values(AUTHORIZED_DEPARTMENTS).includes(data.department)) {
      role = 'AUTHORIZED';
    } else {
      role = 'BASIC';
    }

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

    const user = await userService.createUser({ ...data, role });

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
