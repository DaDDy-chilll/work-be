const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ApiError = require('../helpers/apiError');
const User = require('../models/user.model');
const { JWT_TOKEN_SECRET } = require('../constants');

const createAuthService = () => {
  const _verifyPassword = async ({ plainText, encrypted }) => {
    return await bcrypt.compare(plainText, encrypted);
  };

  const _signToken = ({ payload }) => {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        JWT_TOKEN_SECRET,
        { expiresIn: '1d' },
        (error, token) => {
          if (error) reject(error);

          resolve(token);
        }
      );
    });
  };

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

    const isCorrectPassword = await _verifyPassword({
      plainText: password,
      encrypted: user.password,
    });

    if (!isCorrectPassword) {
      throw loginError;
    }

    user.password = undefined;

    const token = await _signToken({ payload: { userId: user.id } });

    return { user, accessToken: token };
  };

  return {
    getUserByEmail,
    register,
    login,
  };
};

module.exports = createAuthService();
