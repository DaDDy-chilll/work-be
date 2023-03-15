const jwt = require('jsonwebtoken');

const catchAsync = require('../helpers/catchAsync');
const { JWT_TOKEN_SECRET } = require('../constants');
const authService = require('../services/auth.service');
const ApiError = require('../helpers/apiError');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

const createAuthController = () => {
  return {
    login: catchAsync(async (req, res, next) => {
      const data = await authService.login(req.body);

      sendSuccessResponse({
        res,
        data,
        code: 200,
        message: 'User successfully logged in.',
      });
    }),
    register: catchAsync(async (req, res, next) => {
      const user = await authService.getUserByEmail(req.body.email);
      if (user) {
        return next(ApiError.badRequest('Email already exists.'));
      }

      const newUser = await authService.register(req.body);

      sendSuccessResponse({
        res,
        data: newUser,
        code: 201,
        message: 'User successfully registered.',
      });
    }),
  };
};

module.exports = createAuthController();
