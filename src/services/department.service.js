const ApiError = require('../helpers/apiError');

module.exports = ({ Department }) => {
  return Object.freeze({
    createDepartment: async (body) => {
      const existingDepartment = await Department.findOne({ name: body.name });

      if (existingDepartment) {
        throw ApiError.badRequest(
          `${existingDepartment.name} alreadly exists.`
        );
      }

      const department = await Department.create(body);

      return department;
    },
  });
};
