const dayjs = require('../lib/dayjs');
const ApiError = require('../utils/apiError');
const { DOCUMENT_TYPES, DOCUMENT_STATUSES } = require('../constants/document');

/**
 * @param{{
 *  Document: import('../models/document.model')
 *  userService: ReturnType<import('../services/user.service')>;
 *  reviewerGroupService: ReturnType<import('../services/reviewer-groups.service')>;
 * }}
 */
module.exports = ({ Document, userService, reviewerGroupService }) => {
  /**
   * @description
   * Method to check if the requested claim document -
   * 1. has original document
   * 2. is an advance document
   * 3. its original document has been approved.
   * 4. original document already has a claim document
   *
   * @param {string} originalDocumentId
   */
  const checkClaimDocument = async (originalDocumentId) => {
    const orgDoc = await Document.findById(originalDocumentId);

    if (!orgDoc) {
      throw ApiError.badRequest('Original document not found.');
    }

    if (orgDoc.type !== DOCUMENT_TYPES.ADVANCE) {
      throw ApiError.badRequest('Only advance document can be claimed.');
    }

    if (orgDoc.status !== DOCUMENT_STATUSES.APPROVED) {
      throw ApiError.badRequest('Original document is not yet approved.');
    }

    const pastClaimDocument = await Document.findOne({
      originalDocument: originalDocumentId,
    });

    if (pastClaimDocument) {
      throw ApiError.badRequest(
        'Original document already has a claim document.'
      );
    }
  };

  /**
   * @description
   * Gathers reviewers for created document.
   * Requested department needs to -
   * 1. have a head(manager) (which means there must be a person with `canApprove` permission)
   *
   * @param {{workflowId: string, requester: object}}
   */
  const getReviewersForDocument = async ({ workflowId, requester }) => {
    const workflow = await reviewerGroupService.getReviewerGroupById(
      workflowId
    );

    if (!workflow) {
      throw ApiError.badRequest('Workflow does not exist');
    }

    const currentUserHeadOfDepartment =
      await userService.getHeadOfCurrentDepartment(requester.department);

    if (!currentUserHeadOfDepartment) {
      throw ApiError.badRequest(
        'Your department does not have anyone to approve.'
      );
    }

    const reviewers = workflow.reviewers.map((r) => ({
      reviewer: r.reviewer._id,
      department: r.reviewer.department._id,
      ...r.reviewer.permissions,
    }));

    // if requester is not head of dept, add head to reviewers
    if (!currentUserHeadOfDepartment.equals(requester._id)) {
      reviewers.unshift({
        reviewer: currentUserHeadOfDepartment._id,
        department: currentUserHeadOfDepartment.department._id,
        ...currentUserHeadOfDepartment.permissions,
      });
    }

    return reviewers.map((r, idx) => ({ ...r, index: idx }));
  };

  const transformGetAllDocumentsFilter = (
    { sort, limit, page, ...query },
    user
  ) => {
    const filter = {};

    if (query.search) {
      filter.name = {
        $regex: query.search,
        $options: 'i',
      };
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        filter.$or = query.status.map((value) => ({
          status: value,
        }));
      } else {
        filter.status = query.status;
      }
    }

    if (query.amount) {
      filter.amount = parseInt(query.amount, 10);
    }

    if (query.amountMin || query.amountMax) {
      filter.amount = {
        ...(query.amountMin && {
          $gte: parseInt(query.amountMin, 10),
        }),
        ...(query.amountMax && {
          $lte: parseInt(query.amountMax, 10),
        }),
      };
    }

    if (query.requester) {
      filter.requester = query.requester;
    }

    if (query.currentReviewer) {
      filter.currentReviewer = query.currentReviewer;
    }

    if (query.caseStatus) {
      filter.isCaseClosed = query.caseStatus === 'closed';
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {
        ...(query.startDate && {
          $gte: query.startDate,
        }),
        ...(query.endDate && {
          $lte: query.endDate,
        }),
      };
      console.log(filter.createdAt);
    }

    if (user) {
      if (user.department.type !== 'authorized') {
        filter.requestedByDepartment = user.department._id;
      } else if (user.department.type === 'authorized' && query.department) {
        filter.requestedByDepartment = query.department;
      }
    }

    const skip = (page - 1) * limit;

    return { sort, limit, skip, filter };
  };

  const getCurrentReviewer = (document, reviewer) => {
    const currentIndex = document.reviewers.currentReviewerIndex;
    return document.reviewers.list.find(
      ({ reviewer: reviewerId, index }) =>
        index === currentIndex && reviewerId.equals(reviewer.id)
    );
  };

  const canDoAction = (action, permissions) => {
    if (action === 'comment') {
      return true;
    }
    const mappings = {
      prepare: 'canPrepare',
      approve: 'canApprove',
    };
    const permission = mappings[action];
    return permissions[permission];
  };

  const getNextReviewer = (document) => {
    return document.reviewers.list.find(
      (r) => r.index === document.reviewers.currentReviewerIndex + 1
    );
  };

  const setupNextReviewer = (nextReviewerItem) => {
    const updater = {};
    updater.currentReviewer = nextReviewerItem?.reviewer || null;
    updater['reviewers.currentReviewerIndex'] = nextReviewerItem?.index || 0;
    updater['reviewers.currentDepartment'] = nextReviewerItem?.department;
    return updater;
  };

  return Object.freeze({
    checkClaimDocument,
    getReviewersForDocument,
    transformGetAllDocumentsFilter,
    getCurrentReviewer,
    getNextReviewer,
    canDoAction,
    setupNextReviewer,
  });
};
