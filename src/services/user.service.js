const ApiError = require('../helpers/apiError');
const getQuery = require('../helpers/getQuery');
const User = require('../models/user.model');

const createUserService = () => {
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
      throw ApiError.badRequest('User does not exist.');
    }

    return user;
  };

  return {
    getAllUsers,
    getUserById,
  };
};

module.exports = createUserService();
