const catchAsync = require('../helpers/catchAsync');
const reviewerGroupService = require('../services/reviewer-groups.service');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

function createDocumentReviewersController() {
  const getReviewersGroup = catchAsync(async (req, res, next) => {
    const { groups, total } = await reviewerGroupService.getReviewersGroup();

    sendSuccessResponse({
      res,
      data: groups,
      total,
    });
  });

  const createReviewerGroup = catchAsync(async (req, res, next) => {
    const group = await reviewerGroupService.createReviewerGroup(req.body);
    sendSuccessResponse({
      res,
      data: group,
    });
  });

  const getGroupById = catchAsync(async (req, res, next) => {
    const group = await reviewerGroupService.getReviewerGroupById(
      req.params.id
    );

    sendSuccessResponse({ res, data: group });
  });

  const updateReviewerGroup = catchAsync(async (req, res, next) => {
    const updatedGroup = await reviewerGroupService.updateReviewerGroup({
      data: req.body,
      id: req.params.id,
    });

    sendSuccessResponse({
      res,
      data: updatedGroup,
      message: 'Updated successfully',
    });
  });

  const getValidReviewerGroups = catchAsync(async (req, res, next) => {
    const dept = req.params.dept || 'admin';
    const { groups } = await reviewerGroupService.getReviewersGroup();

    const filteredGroups = groups.filter((group) =>
      group.reviewers.some(
        ({ user }) =>
          user.permissions[dept].approve && user.permissions[dept].verify
      )
    );

    sendSuccessResponse({
      res,
      data: filteredGroups,
      total: filteredGroups.length,
    });
  });

  return {
    getReviewersGroup,
    createReviewerGroup,
    updateReviewerGroup,
    getGroupById,
    getValidReviewerGroups,
  };
}

module.exports = createDocumentReviewersController();
