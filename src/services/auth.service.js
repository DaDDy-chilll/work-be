const User = require('../models/user.model');

const createAuthService = () => {
  return {
    getUserByEmail: async (email) => {
      const user = await User.findOne({ email });

      return user;
    },
    register: async (data) => {
      const user = await User.create(data);
      user.password = undefined;

      return user;
    },
  };
};

module.exports = createAuthService();
