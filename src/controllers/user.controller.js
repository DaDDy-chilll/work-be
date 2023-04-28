const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const userService = require('../services/user.service');
const { getFilterForGetAllUsers } = require('./helpers/user.helper');

const createUserController = () => {
  const getAllUsers = catchAsync(async (req, res, next) => {
    const query = getFilterForGetAllUsers({ query: req.query });
    const { users, total } = await userService.getAllUsers(query);

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

  const updateUserById = catchAsync(async (req, res, next) => {
    const updatedUser = await userService.updateUserById({
      id: req.params.id,
      data: req.body,
    });

    sendSuccessResponse({
      res,
      data: updatedUser,
      code: 201,
    });
  });

  const checkApprovalEligibilityForUsers = catchAsync(
    async (req, res, next) => {
      const isValid = await userService.areUsersValidReviewers(
        req.body.reviewers || [],
        req.params.dept
      );

      sendSuccessResponse({
        res,
        data: isValid,
      });
    }
  );

  const getValidReviewers = catchAsync(async (req, res, next) => {
    const { users, total } = await userService.getValidReviewers(
      req.params.dept
    );

    sendSuccessResponse({
      res,
      data: users,
      total,
    });
  });

  return {
    getAllUsers,
    getUserById,
    getMe,
    deleteUserById,
    updateUserById,
    checkApprovalEligibilityForUsers,
    getValidReviewers,
  };
};

module.exports = createUserController();
