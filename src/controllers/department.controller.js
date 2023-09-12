const catchAsync = require('../utils/catchAsync');
const sendSuccessResponse = require('../utils/sendSuccessResponse');

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

    searchDepartments: catchAsync(async (req, res, next) => {
      const { departments, total } = await departmentService.getDepartments({
        name: {
          $regex: req.query.q,
          $options: 'i',
        },
      });

      sendSuccessResponse({
        res,
        data: departments,
        total,
      });
    }),
  });
};
