const ApiError = require('../helpers/apiError');
const catchAsync = require('../helpers/catchAsync');
const Document = require('../models/document.model');

module.exports = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const document = await Document.findById(id);

  if (!document) {
    throw ApiError.badRequest('Document does not exist.');
  }

  const reviewer = document.reviewers.list.find(
    (item) =>
      item.reviewer.equals(req.user._id) &&
      item.index === document.reviewers.currentReviewerIndex &&
      item.department === document.reviewers.currentDepartment
  );

  if (!reviewer) {
    throw ApiError.badRequest('Cannot perform this action.');
  }

  req.document = document;
  req.reviewerPermissions = {
    canApprove: reviewer.canApprove,
    canEdit: reviewer.canEdit,
    canPrepare: reviewer.canPrepare,
    canVerify: reviewer.canVerify,
  };

  next();
});
