const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

module.exports = ({ departmentService }) => {
  return Object.freeze({
    createDepartment: catchAsync(async (req, res, next) => {
      const department = await departmentService.createDepartment(req.body);

      sendSuccessResponse({
        res,
        data: department,
        message: 'Department created.',
      });
    }),

    getDepartments: catchAsync(async (req, res, next) => {
      const { departments, total } = await departmentService.getDepartments(
        req.query
      );

      sendSuccessResponse({
        res,
        data: departments,
        total,
      });
    }),
  });
};
