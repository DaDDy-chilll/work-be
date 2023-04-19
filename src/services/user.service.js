const { userRoles } = require('../constants');
const { USER_ROLES } = require('../constants/user');
const ApiError = require('../helpers/apiError');
const getQuery = require('../helpers/getQuery');
const User = require('../models/user.model');

const createUserService = () => {
  const _noUserError = ApiError.badRequest('User does not exist.');

  const _getFilterForGetAllUsers = ({ queryFilter }) => {
    const filter = {};

    if (queryFilter.name) {
      filter.name = {
        $regex: queryFilter.name,
        $options: 'i',
      };
    }

    if (queryFilter.role) {
      filter.role = queryFilter.role;
    }

    return filter;
  };

  const getAllUsers = async ({ query }) => {
    const { skip, limit, sort, queryFilter } = getQuery(query);

    const filter = _getFilterForGetAllUsers({ queryFilter });

    const total = await User.count(filter);

    const users = await User.find(filter).sort(sort).skip(skip).limit(limit);

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

  const checkIfUserValidAssignee = async (userId) => {
    const user = await User.findById(userId);

    const validRoles = [
      USER_ROLES.superadmin,
      USER_ROLES.admin,
      USER_ROLES.superadmin,
      USER_ROLES.executive,
    ];

    return Boolean(user && validRoles.includes(user.role));
  };

  return {
    getAllUsers,
    getUserById,
    deleteUserById,
    updateUserById,
    checkIfUserValidAssignee,
  };
};

module.exports = createUserService();
