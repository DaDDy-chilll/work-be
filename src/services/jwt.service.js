const jwt = require('jsonwebtoken');
const { JWT_TOKEN_SECRET } = require('../constants/app');
const ApiError = require('../utils/apiError');

const createJwtService = ({ User }) => {
  return Object.freeze({
    signToken: ({ payload }) => {
      return new Promise((resolve, reject) => {
        jwt.sign(
          payload,
          JWT_TOKEN_SECRET,
          { expiresIn: '1d' },
          (error, token) => {
            if (error) {
              return reject(error);
            }

            resolve(token);
          }
        );
      });
    },

    verifyToken: async (token) => {
      if (typeof token === 'undefined') {
        throw new Error('Invalid token.');
      }

      return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_TOKEN_SECRET, {}, async (error, decoded) => {
          if (error) {
            reject(ApiError.notAuthenticated('Invalid token.'));
          }

          const { userId } = decoded;

          if (!userId) {
            reject(ApiError.notAuthenticated('Invalid user.'));
          }

          const user = await User.findById(userId);

          if (!user) {
            reject(ApiError.notAuthenticated('Invalid user.'));
          }

          resolve(user);
        });
      });
    },
  });
};

module.exports = { createJwtService };
