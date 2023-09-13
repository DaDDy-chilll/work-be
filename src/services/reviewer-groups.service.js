const _ = require('lodash');

const ApiError = require('../utils/apiError');

/**
 * @typedef {Object} Dependencies
 * @property {ReturnType<import('./user.service')>} userService
 * @property {typeof import('../models/reviewer-group.model')} ReviewerGroup
 *
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ ReviewerGroup, userService }) => {
  const validateReviewerGroup = async (reviewers) => {
    let tempReviewers = await Promise.all(
      reviewers.map(async (item) => {
        const reviewer = await userService.getUserById({ id: item.reviewer });
        return {
          ...item,
          reviewer,
        };
      })
    );

    const sortedReviewersByIdx = _.sortBy(tempReviewers, 'index');

    let departments = [];

    for (let i = 0; i < sortedReviewersByIdx.length - 1; i++) {
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
        if (!curr.reviewer.permissions.canApprove) {
          return {
            status: false,
            message: `Last person in ${curr.reviewer.department.name} must have approve privilege.`,
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

    departments = [...new Set([...departments])];

    // if (departments.length !== departmentOrders.length) {
    //   return {
    //     status: false,
    //     message: 'Missing department(s)',
    //   };
    // }

    return { status: true };
  };
  const getReviewersGroup = async () => {
    const groups = await ReviewerGroup.find()
      .populate('reviewers.reviewer')
      .populate('reviewers.department');
    const total = await ReviewerGroup.count();
    return { groups, total };
  };

  const createReviewerGroup = async (data) => {
    const validation = await validateReviewerGroup(
      data.reviewers,
      data.departmentOrders
    );

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
    return await ReviewerGroup.findById(id)
      .populate({
        path: 'reviewers.reviewer',
        populate: {
          path: 'department',
        },
      })
      .populate({
        path: 'reviewers.department',
      });
  };

  return {
    getReviewersGroup,
    createReviewerGroup,
    getReviewerGroupById,
    updateReviewerGroup,
  };
};
