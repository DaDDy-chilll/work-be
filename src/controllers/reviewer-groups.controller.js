const { REVIEWER_GROUP_TYPES } = require('../constants/reviewer-group');
const catchAsync = require('../utils/catchAsync');
const sendSuccessResponse = require('../utils/sendSuccessResponse');
const { checkCanForward } = require('./helpers/reviewer-group.helper');

module.exports = ({ reviewerGroupService }) => {
  const getReviewersGroup = catchAsync(async (req, res, next) => {
    if (req.query.type === REVIEWER_GROUP_TYPES.PRIVATE) {
      checkCanForward(req.user);
    }

    const { groups, total } = await reviewerGroupService.getReviewersGroup(
      req.query
    );

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

  const addFavouriteReviewerGroup = catchAsync(async (req, res, next) => {
    const updatedGroup = await reviewerGroupService.addFavouriteReviewerGroup({
      requester: req.user,
      workflowId: req.params.id,
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
    addFavouriteReviewerGroup,
  };
};
