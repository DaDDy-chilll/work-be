const catchAsync = require('../helpers/catchAsync');
const assigneeGroupService = require('../services/assignees-groups.service');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const userService = require('../services/user.service');
const ApiError = require('../helpers/apiError');

function createDocumentAssigneesController() {
  const getAssigneesGroup = catchAsync(async (req, res, next) => {
    const { groups, total } = await assigneeGroupService.getAssigneesGroup();

    sendSuccessResponse({
      res,
      data: groups,
      total,
    });
  });

  const createAssigneeGroup = catchAsync(async (req, res, next) => {
    const validAssigneesBooleans = await Promise.all(
      req.body.assignees.map(
        async (assignee) =>
          await userService.checkIfUserValidAssignee(assignee.person)
      )
    );

    if (validAssigneesBooleans.some((bool) => !bool)) {
      throw ApiError.badRequest('User is not eligible to be an assignee.');
    }

    const group = await assigneeGroupService.createAssigneeGroup(req.body);
    sendSuccessResponse({
      res,
      data: group,
    });
  });

  return { getAssigneesGroup, createAssigneeGroup };
}

module.exports = createDocumentAssigneesController();
