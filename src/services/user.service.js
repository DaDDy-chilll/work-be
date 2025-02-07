const { userRoles } = require('../constants');
const ApiError = require('../utils/apiError');
const extractQuery = require('../utils/extractQuery');

/**
 * @typedef {Object} Dependencies
 * @property {typeof import('../models/user.model')} User
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ User }) => {
  const _noUserError = ApiError.badRequest('User does not exist.');

  const createUser = async (body) => {
    const user = await User.create(body);
    user.password = undefined;

    return user;
  };

  const getAllUsers = async (query) => {
    const { filter, limit, sort, skip } = extractQuery(query, (oldFilter) => {
      const filter = {};

      if (oldFilter.search) {
        filter.$or = [
          {
            name: {
              $regex: oldFilter.search,
              $options: 'i',
            },
          },
          {
            email: {
              $regex: oldFilter.search,
              $options: 'i',
            },
          },
        ];
      }

      if (oldFilter.department) {
        filter.department = oldFilter.department;
      }

      filter.isDisabled = !!oldFilter?.isDisabled;

      return filter;
    });

    const total = await User.count(filter);

    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'department',
      })
      .populate('favouriteWorkflows');

    return { users, total };
  };

  const getUserById = async ({ id }) => {
    const user = await User.findById(id)
      .populate({
        path: 'department',
      })
      .populate({
        path: 'favouriteWorkflows',
        populate: {
          path: 'reviewers.department',
        },
      });

    if (!user) {
      throw _noUserError;
    }

    return user;
  };

  const getHeadOfCurrentDepartment = (departmentId) => {
    return User.findOne({
      department: departmentId,
      'permissions.canApprove': true,
    })
      .populate('department')
      .populate('favouriteWorkflows');
  };

  const deleteUserById = async ({ id }) => {
    const user = await User.findById(id);

    if (!user) {
      throw _noUserError;
    }

    if (user.role === userRoles.superadmin) {
      throw ApiError.badRequest('Cannot delete the user.');
    }

    const deletedUser = await User.findByIdAndDelete(id);

    return deletedUser;
  };

  const updateUserById = async ({ id, data }) => {
    const isEmptyData = Object.keys(data).length === 0;
    if (isEmptyData) {
      throw ApiError.badRequest('No data provided.');
    }

    const user = await User.findById(id);

    if (!user) {
      throw _noUserError;
    }

    if (data.permissions?.canApprove) {
      const userWithApprovePermission = await User.findOne({
        'permissions.canApprove': true,
        department: data.department,
      });
      if (userWithApprovePermission && id !== userWithApprovePermission.id) {
        throw ApiError.badRequest(
          "There's already one person with approve permission."
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });

    return updatedUser;
  };

  const areUsersValidReviewers = async (userIdList, dept) => {
    return (
      await Promise.all(
        userIdList.map(async (id) => {
          const user = await User.findById(id);

          return user && user.permissions[dept].approve;
        })
      )
    ).every((bool) => bool);
  };

  const getInvalidReviewer = async (userIdList, dept = '') => {
    const userLists = await Promise.all(
      userIdList.map(async (id) => {
        const user = await User.findById(id);

        return user;
      })
    );

    return userLists.find((user) => !user.permissions[dept].approve) || null;
  };

  const getValidReviewers = async (dept) => {
    const users = await User.find({
      [`permissions.${dept}.approve`]: true,
    });
    return { users, total: users.length };
  };

  const disableUser = async (userId) => {
    const user = await User.findOneAndUpdate(
      { _id: userId, isSuperadmin: false },
      { isDisabled: true },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  };

  const addFavouriteReviewerGroup = async ({ userId, workflowId }) => {
    const user = await User.findById(userId);

    const isFavourite = user.favouriteWorkflows.includes(workflowId);

    if (isFavourite) {
      return await User.findByIdAndUpdate(
        userId,
        { $pull: { favouriteWorkflows: workflowId } },
        { new: true }
      );
    }

    return await User.findByIdAndUpdate(
      userId,
      { $push: { favouriteWorkflows: workflowId } },
      { new: true }
    );
  };

  return {
    createUser,
    getAllUsers,
    getUserById,
    deleteUserById,
    updateUserById,
    areUsersValidReviewers,
    getInvalidReviewer,
    getValidReviewers,
    getHeadOfCurrentDepartment,
    disableUser,
    addFavouriteReviewerGroup,
  };
};
