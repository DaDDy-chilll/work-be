const ApiError = require('../helpers/apiError');

module.exports = ({ ReviewerGroup }) => {
  const getReviewersGroup = async () => {
    const groups = await ReviewerGroup.find().populate('reviewers.reviewer');
    const total = await ReviewerGroup.count();
    return { groups, total };
  };

  const createReviewerGroup = async (data) => {
    return await ReviewerGroup.create(data);
  };

  const updateReviewerGroup = async ({ data, id }) => {
    const group = await ReviewerGroup.findById(id);

    if (!group) {
      throw ApiError.badRequest('Group does not exist.');
    }

    group.reviewers = data.reviewers;
    group.groupName = data.groupName || '';

    await group.save();

    return group;
  };

  const getReviewerGroupById = async (id) => {
    return await ReviewerGroup.findById(id);
  };

  return {
    getReviewersGroup,
    createReviewerGroup,
    getReviewerGroupById,
    updateReviewerGroup,
  };
};
