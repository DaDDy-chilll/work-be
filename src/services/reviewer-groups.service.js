const _ = require('lodash');

const {
  DEPARTMENT_LEVELS,
  AUTHORIZED_DEPARTMENTS,
} = require('../constants/user');
const ApiError = require('../helpers/apiError');

module.exports = ({ ReviewerGroup, userService }) => {
  const validateReviewerGroup = async (reviewers) => {
    let tempReviewers = await Promise.all(
      reviewers.map(async (item) => {
        const reviewer = await userService.getUserById(item.reviewer);
        return {
          ...item,
          reviewer,
        };
      })
    );

    const sortedReviewersByIdx = _.sortBy(tempReviewers, 'index');

    let departments = [];

    for (let i = 0; i < sortedReviewersByIdx.length; i++) {
      const curr = sortedReviewersByIdx[i];
      const next = sortedReviewersByIdx[i + 1];

      departments.push(curr.department);

      // index should start from zero
      // and be incrementally order
      // Checks by comparing with iterator
      if (i !== curr.index) {
        return {
          status: false,
          message: 'Indexes must be incrementally ordered.',
        };
      }

      if (!next) {
        break;
      }

      if (curr.department !== next.department) {
        const diff =
          DEPARTMENT_LEVELS[next.department] -
          DEPARTMENT_LEVELS[curr.department];

        // Checks correct dept order
        if (diff !== 1) {
          return {
            status: false,
            message: `Wrong department order: ${curr.department} & ${next.department}`,
          };
        }

        if (!curr.reviewer.permissions.canApprove) {
          return {
            status: false,
            message: `Last person in ${curr.department} must have approve privilege.`,
          };
        }
      } else {
        if (curr.reviewer.permissions.canApprove) {
          return {
            status: false,
            message: `Only last person in ${curr.department} can have approve privilege.`,
          };
        }
      }
    }

    if (
      departments.length !==
      Object.values(AUTHORIZED_DEPARTMENTS).filter((d) => d !== 'OFFICE_ADMIN')
        .length
    ) {
      return {
        status: false,
        message: 'Missing department(s)',
      };
    }

    return { status: true };
  };
  const getReviewersGroup = async () => {
    const groups = await ReviewerGroup.find().populate('reviewers.reviewer');
    const total = await ReviewerGroup.count();
    return { groups, total };
  };

  const createReviewerGroup = async (data) => {
    const validation = await validateReviewerGroup(data.reviewers);

    if (!validation.status) {
      throw ApiError.badRequest(validation.message);
    }

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
