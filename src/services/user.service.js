const { userRoles } = require('../constants');
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

    if (user.role === 'Superadmin') {
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

  return {
    getAllUsers,
    getUserById,
    deleteUserById,
    updateUserById,
  };
};

module.exports = createUserService();
