const Logger = require('../logger');
const ApiError = require('../utils/apiError');
const extractQuery = require('../utils/extractQuery');

const createDepartmentService = ({ Department }) => {
  const logger = new Logger('department-service');
  return Object.freeze({
    createDepartment: async (body) => {
      const existingDepartment = await Department.findOne({ name: body.name });

      if (existingDepartment) {
        throw ApiError.badRequest(
          `${existingDepartment.name} alreadly exists.`
        );
      }

      const department = await Department.create(body);
      logger.info(`Department created with name: ${department.name}`);

      return department;
    },

    getDepartments: async (query) => {
      const { sort, limit, skip, filter } = extractQuery(
        query,
        (filter) => filter
      );

      const [departments, total] = await Promise.all([
        Department.find(filter).sort(sort).skip(skip).limit(limit),
        Department.count(filter),
      ]);

      return { departments, total };
    },

    getStartingDepartment: async () => {
      return await Department.findOne({ isStartingDepartment: true });
    },
  });
};

module.exports = { createDepartmentService };
