const { userRoles } = require('../constants');
const ApiError = require('../helpers/apiError');

module.exports = ({ User }) => {
  const _noUserError = ApiError.badRequest('User does not exist.');

  const createUser = async (body) => {
    const user = await User.create(body);
    user.password = undefined;

    return user;
  };

  const getAllUsers = async ({ filter, sort, skip, limit }) => {
    const total = await User.count(filter);

    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'department',
        transform: (doc, id) => (doc === null ? id : doc.name),
      });

    return { users, total };
  };

  const getUserById = async ({ id }) => {
    const user = await User.findById(id);

    if (!user) {
      throw _noUserError;
    }

    return user;
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

  return {
    createUser,
    getAllUsers,
    getUserById,
    deleteUserById,
    updateUserById,
    areUsersValidReviewers,
    getInvalidReviewer,
    getValidReviewers,
  };
};
