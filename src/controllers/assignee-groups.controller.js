const catchAsync = require('../helpers/catchAsync');
const assigneeGroupService = require('../services/assignees-groups.service');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

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
    // TODO: Check if assignees are valid

    const group = await assigneeGroupService.createAssigneeGroup(req.body);
    sendSuccessResponse({
      res,
      data: group,
    });
  });

  return { getAssigneesGroup, createAssigneeGroup };
}

module.exports = createDocumentAssigneesController();
