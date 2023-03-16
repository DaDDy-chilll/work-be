const jwt = require('jsonwebtoken');

const ApiError = require('../helpers/apiError');
const catchAsync = require('../helpers/catchAsync');
const { JWT_TOKEN_SECRET } = require('../constants');
const User = require('../models/user.model');

const authenticate = catchAsync(async (req, res, next) => {
  const noTokenError = ApiError.notAuthenticated('Not logged in.');
  const badTokenError = ApiError.notAuthenticated('Session expired.');

  const bearerToken = req.headers.authorization;

  if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
    return next(noTokenError);
  }

  const [, token] = bearerToken.split(' ');

  if (!token) {
    return next(noTokenError);
  }

  jwt.verify(token, JWT_TOKEN_SECRET, {}, async (error, decoded) => {
    if (error) return next(badTokenError);

    const { userId } = decoded;

    if (!userId) {
      return next(badTokenError);
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(badTokenError);
    }

    req.user = user;

    next();
  });
});

module.exports = authenticate;
