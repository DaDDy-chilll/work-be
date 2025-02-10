const _ = require('lodash');

const ApiError = require('../utils/apiError');
const extractQuery = require('../utils/extractQuery');
const {
  REVIEWER_GROUP_TYPES,
  WORKFLOW_TYPES,
} = require('../constants/reviewer-group');
const {
  checkCanForward,
} = require('../controllers/helpers/reviewer-group.helper');
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
    const reviewersByDepartment = _.groupBy(sortedReviewersByIdx, 'department');
    let departments = [];
    let approvers = [];

    for (let i = 0; i < sortedReviewersByIdx.length - 1; i++) {
      const curr = sortedReviewersByIdx[i];
      const next = sortedReviewersByIdx[i + 1];
   
      departments.push(curr.department);
      if (curr.reviewer.permissions.canApprove) {
        approvers.push(curr);
      }
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

      let approveReviewer = approvers.some(
        (approver) =>
          approver.department === curr.department &&
          approver.reviewer.permissions.canApprove !==
            curr.reviewer.permissions.canApprove
      );

      if (curr.department !== next.department && approvers.length > 0) {
        if (!curr.reviewer.permissions.canApprove) {
          return {
            status: false,
            message: `Last person in ${curr.reviewer.department.name} must have approve privilege.`,
          };
        }
      } else {
        if (curr.reviewer.permissions.canApprove && approveReviewer) {
          return {
            status: false,
            message: `Only last person in ${curr.reviewer.department.name} can have approve privilege.`,
          };
        }
      }
      approvers = [];
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
  const getReviewersGroup = async (query) => {
    const { filter, limit, sort, skip } = extractQuery(query, (oldFilter) => {
      const filter = {};
      if (oldFilter.search) {
        const searchTerm = oldFilter.search.trim();
        const isGroupIdSearch = /^rg-/i.test(searchTerm);

        if (isGroupIdSearch) {
          filter.$or = [
            {
              groupId: {
                $regex: searchTerm,
                $options: 'i',
              },
            },
          ];
        } else {
          filter.$or = [
            {
              name: {
                $regex: searchTerm,
                $options: 'i',
              },
            },
          ];
        }
      }
      if (oldFilter.workflowType) {
        filter.workflowType = oldFilter.workflowType;
      }

      if (oldFilter.type) {
        filter.type = oldFilter.type;
      }

      if (oldFilter.isDisabled) {
        filter.isDisabled = JSON.parse(oldFilter.isDisabled);
      }

      if (oldFilter.workflowType) {
        filter.workflowType = oldFilter.workflowType;
      }

      return filter;
    });


    const groups = await ReviewerGroup.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'reviewers.reviewer',
      })
      .populate({
        path: 'reviewers.department',
      });
    const total = await ReviewerGroup.count(filter);
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

    const validation = await validateReviewerGroup(
      data.reviewers,
      data.departmentOrders
    );

    if (!validation.status) {
      throw ApiError.badRequest(validation.message);
    }

    // await ReviewerGroup.findByIdAndDelete(id);

    // return await ReviewerGroup.create(data);

    return await ReviewerGroup.findByIdAndUpdate(id, data, { new: true });
  };

  const getReviewerGroupById = async (
    id,
    workflowType = WORKFLOW_TYPES.PURCHASE_REQUEST
  ) => {
    if (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER)
      return await ReviewerGroup.findById(id)
        .populate({
          path: 'reviewers.reviewer',
          populate: {
            path: 'department',
          },
        })
        .populate({
          path: 'reviewers.department',
        })
        .populate({
          path: 'workflowOrderId',
          populate: {
            path: 'reviewers.reviewer reviewers.department',
          },
        });
    else
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

  const addFavouriteReviewerGroup = async ({ requester, workflowId }) => {
    const user = await userService.getUserById({ id: requester.id });
    const workflow = await ReviewerGroup.findById(workflowId);

    if (!user) {
      throw ApiError.badRequest('User does not exist.');
    }
    if (!workflow) {
      throw ApiError.badRequest('Workflow does not exist');
    }

    if (workflow?.type === REVIEWER_GROUP_TYPES.PRIVATE) {
      checkCanForward(requester);
    }

    return await userService.addFavouriteReviewerGroup({
      userId: requester.id,
      workflowId,
    });
  };

  const disableReviewerGroupsByUserId = async (userId) => {
    await ReviewerGroup.updateMany(
      {
        'reviewers.reviewer': userId,
      },
      { isDisabled: true },
      { new: true, runValidators: true }
    );
  };

  return {
    getReviewersGroup,
    createReviewerGroup,
    getReviewerGroupById,
    updateReviewerGroup,
    addFavouriteReviewerGroup,
    disableReviewerGroupsByUserId,
  };
};
