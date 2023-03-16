const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const userService = require('../services/user.service');

const createUserController = () => {
  const getAllUsers = catchAsync(async (req, res, next) => {
    const { users, total } = await userService.getAllUsers({
      query: req.query,
    });

    sendSuccessResponse({
      res,
      data: users,
      total,
    });
  });

  const getUserById = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById({ id: req.params.id });

    sendSuccessResponse({
      res,
      data: user,
    });
  });

  const getMe = (req, res, next) => {
    sendSuccessResponse({
      res,
      data: req.user,
    });
  };

  const deleteUserById = catchAsync(async (req, res, next) => {
    const deletedUser = await userService.deleteUserById({ id: req.params.id });

    sendSuccessResponse({
      res,
      data: deletedUser,
    });
  });

  return {
    getAllUsers,
    getUserById,
    getMe,
    deleteUserById,
  };
};

module.exports = createUserController();
