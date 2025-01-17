const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');
const sendSuccessResponse = require('../utils/sendSuccessResponse');

module.exports = ({ authService }) => {
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

    updatePassword: catchAsync(async (req, res, next) => {
      const updatedUser = await authService.updatePassword({
        ...req.body,
        userId: req.user._id,
      });

      sendSuccessResponse({
        res,
        data: updatedUser,
        message: "User's password has been updated.",
      });
    }),

    updateUserPassword: catchAsync(async (req, res, next) => {
      const updatedUser = await authService.updatePassword({
        ...req.body,
        userId: req.params.id,
      });

      sendSuccessResponse({
        res,
        data: updatedUser,
        message: "User's password has been updated.",
      });
    }),
  };
};
