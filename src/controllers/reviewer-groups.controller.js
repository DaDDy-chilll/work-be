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
    // TODO: Check if reviewers are valid

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

  return {
    getReviewersGroup,
    createReviewerGroup,
    updateReviewerGroup,
    getGroupById,
  };
}

module.exports = createDocumentReviewersController();
