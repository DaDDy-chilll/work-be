const ApiError = require('../helpers/apiError');
const transformQuery = require('../helpers/transformQuery');
const User = require('../models/user.model');

const createUserService = () => {
  const getAllUsers = async ({ query }) => {
    const { skip, limit, sort } = transformQuery(query);

    const total = await User.count();

    const users = await User.find().sort(sort).skip(skip).limit(limit);

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
