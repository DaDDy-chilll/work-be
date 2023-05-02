const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_TOKEN_SECRET } = require('../../constants/app');

const verifyPassword = async ({ plainText, encrypted }) => {
  return await bcrypt.compare(plainText, encrypted);
};

const signToken = ({ payload }) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_TOKEN_SECRET, { expiresIn: '1d' }, (error, token) => {
      if (error) reject(error);

      resolve(token);
    });
  });
};

module.exports = {
  verifyPassword,
  signToken,
};
