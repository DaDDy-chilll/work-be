const ApiError = require('../helpers/apiError');
const ReviewerGroup = require('../models/reviewer-group.model');

const createReviewersService = () => {
  const _areOrdersDuplicated = (reviewers) => {
    const numberOfReviewers = reviewers.length;

    for (let i = 0; i < numberOfReviewers; i++) {
      for (let j = i + 1; j < numberOfReviewers; j++) {
        if (reviewers[i].order === reviewers[j].order) {
          return true;
        }
      }
    }

    return false;
  };

  const getReviewersGroup = async () => {
    const groups = await ReviewerGroup.find();
    const total = await ReviewerGroup.count();
    return { groups, total };
  };

  const createReviewerGroup = async (data) => {
    if (_areOrdersDuplicated(data.reviewers)) {
      throw ApiError.badRequest('Orders are duplicated.');
    }
    return await ReviewerGroup.create(data);
  };

  const updateReviewerGroup = async ({ data, id }) => {
    if (_areOrdersDuplicated(data.reviewers)) {
      throw ApiError.badRequest('Orders are duplicated.');
    }

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

module.exports = createReviewersService();
