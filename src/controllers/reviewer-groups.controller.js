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

  return { getReviewersGroup, createReviewerGroup };
}

module.exports = createDocumentReviewersController();
