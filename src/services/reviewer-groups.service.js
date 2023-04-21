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

  const getReviewerGroupById = async (id) => {
    return await ReviewerGroup.findById(id);
  };

  return { getReviewersGroup, createReviewerGroup, getReviewerGroupById };
};

module.exports = createReviewersService();
