const { isObjectIdOrHexString } = require('mongoose');
const {
  DOCUMENT_SECTIONS,
  DOCUMENT_ACTIONS,
  DOCUMENT_STATUSES,
} = require('../constants/document');
const ApiError = require('../helpers/apiError');
const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const documentService = require('../services/document.service');
const userService = require('../services/user.service');
const historyService = require('../services/history.service');
const {
  AUTHORIZED_DEPARTMENTS,
  DEPARTMENT_LEVELS,
} = require('../constants/user');
const reviewerGroupsService = require('../services/reviewer-groups.service');
const revisionService = require('../services/revision.service');

const helpers = {
  extractReviewerIdList: (reviewers) => {
    return reviewers.map((reviewer) => reviewer.user);
  },
  extractFilter: (query) => {
    let { sort, limit, ...params } = query;

    sort = sort || '-createdAt';
    limit = limit ? parseInt(limit, 10) : 10;

    const filter = {};

    if (params.status) {
      if (Array.isArray(params.status)) {
        filter.$or = params.status.map((value) => ({
          'state.status': value,
        }));
      } else {
        filter['state.status'] = params.status;
      }
    }

    if (params.section) {
      filter['state.section'] = params.section;
    }

    if (params.amount) {
      filter.amount = parseInt(params.amount, 10);
    }

    if (params.amountMin || params.amountMax) {
      filter.amount = {
        ...(params.amountMin && {
          $gte: parseInt(params.amountMin, 10),
        }),
        ...(params.amountMax && {
          $lte: parseInt(params.amountMax, 10),
        }),
      };
    }

    if (params.requestedBy) {
      filter.requestedBy = params.requestedBy;
    }

    if (params.history) {
      filter['remarks.action'] =
        params.history.action || DOCUMENT_ACTIONS.approve;
      filter['remarks.section'] =
        params.history.section || DOCUMENT_SECTIONS.admin;
    }

    if (
      params.currentReviewer &&
      isObjectIdOrHexString(params.currentReviewer)
    ) {
      filter['state.currentReviewer'] = params.currentReviewer;
    }

    return { sort, limit, filter };
  },
  getPeopleToAcknowledge: (document) => {
    // Requester + people who's already approved/verified/prepared

    const requester = document.requester;

    const peopleThatHaveDoneActions = document.reviewers.list
      .filter(
        (reviewer) =>
          DEPARTMENT_LEVELS[reviewer.department] <
          DEPARTMENT_LEVELS[document.reviewers.currentDepartment]
      )
      .map(({ reviewer }) => reviewer);

    return [requester, ...peopleThatHaveDoneActions];
  },
};

const createDocumentController = () => {
  const { getPeopleToAcknowledge } = helpers;
  const createDocument = catchAsync(async (req, res, next) => {
    const { users: officeAdmins } = await userService.getAllUsers({
      filter: {
        department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
      },
    });

    if (officeAdmins.length < 2) {
      return next(ApiError.badRequest());
    }

    const attachments = await documentService.uploadAttachments(req.files);
    const document = await documentService.createRequisitionDocument({
      ...req.body,
      requester: req.user._id,
      attachments,
      status: DOCUMENT_STATUSES.PENDING,
      reviewers: {
        currentReviewerId: officeAdmins[0]._id,
        list: [
          {
            reviewer: officeAdmins[0]._id,
            index: 0,
            department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
            canPrepare: true,
            canEdit: true,
            canApprove: false,
            canVerify: true,
          },
          {
            reviewer: officeAdmins[1]._id,
            index: 1,
            department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
            canPrepare: false,
            canEdit: false,
            canApprove: true,
            canVerify: false,
          },
        ],
      },
    });

    const history = await historyService.createHistory({
      actor: req.user._id,
      department: req.user.department,
      action: DOCUMENT_ACTIONS.SUBMITTED,
      document: document._id,
    });

    document.histories.push(history);

    sendSuccessResponse({
      res,
      code: 201,
      data: document,
      message: 'Document successfully created.',
    });
  });

  const prepareDocument = catchAsync(async (req, res, next) => {
    const { remark = 'No remark', ...data } = req.body;
    const document = await documentService.prepareDocument({
      data,
      reviewerId: req.user._id,
      document: req.document,
      remark,
      reviewerPermissions: req.reviewerPermissions,
    });

    const history = await historyService.createHistory({
      actor: req.user._id,
      action: DOCUMENT_ACTIONS.PREPARED,
      department: req.user.department,
      document: document.id,
      content: remark,
    });

    document.histories.push(history);

    sendSuccessResponse({
      res,
      code: 201,
      data: document,
      message: 'Prepared the document.',
    });
  });

  const verifyDocument = catchAsync(async (req, res, next) => {
    const { remark } = req.body;

    const document = await documentService.verifyDocument({
      reviewerId: req.user._id,
      document: req.document,
      remark,
      reviewerPermissions: req.reviewerPermissions,
    });

    const history = await historyService.createHistory({
      actor: req.user._id,
      action: DOCUMENT_ACTIONS.VERIFIED,
      department: req.user.department,
      document: document.id,
      content: remark,
    });

    document.histories.push(history);

    sendSuccessResponse({
      res,
      data: document,
      message: 'Verified the document.',
    });
  });

  const approveDocument = catchAsync(async (req, res, next) => {
    const { remark, groupId } = req.body;

    // office admin must assign a reviewer group in approval
    let group;
    if (
      req.document.reviewers.currentDepartment ===
      AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN
    ) {
      group = await reviewerGroupsService.getReviewerGroupById(groupId);

      if (!group) {
        return next(ApiError.badRequest('Group not found.'));
      }
    }

    const document = await documentService.approveDocument({
      reviewerId: req.user._id,
      document: req.document,
      remark,
      reviewerPermissions: req.reviewerPermissions,
      group,
    });

    const history = await historyService.createHistory({
      actor: req.user._id,
      action: DOCUMENT_ACTIONS.APPROVED,
      department: req.user.department,
      document: document.id,
      content: remark,
    });

    document.histories.push(history);

    sendSuccessResponse({
      res,
      data: document,
      message: 'Approved the document',
    });
  });

  const requestRevision = catchAsync(async (req, res, next) => {
    // Department to revis
    const { department, remark } = req.body;

    const revisor = req.document.reviewers.list.find(
      (item) => item.canEdit && item.department === department
    );

    if (!revisor) {
      return next(
        ApiError.badRequest(`No person available to revise in ${department}`)
      );
    }

    const document = await documentService.requestRevision({
      document: req.document,
      reviewer: req.user,
    });

    const history = await historyService.createHistory({
      actor: req.user.id,
      action: DOCUMENT_ACTIONS.REQUSTED_REVISION,
      department: req.user.department,
      document: document.id,
      content: remark,
    });

    await revisionService.createRevision({
      documentId: document.id,
      requester: req.user,
      reviewer: revisor,
      historyId: history.id,
    });

    sendSuccessResponse({
      res,
      code: 201,
      message: 'Successfully requested revision.',
    });
  });

  const reviseDocument = catchAsync(async (req, res, next) => {
    const { id: documentId } = req.params.id;
    const user = req.user;
    const { remark, ...data } = req.body;

    const revision = await revisionService.getActiveRevision({
      documentId,
    });

    if (!revision) {
      return next(ApiError.badRequest('No revision found.'));
    }

    if (!revision.reviewer.equals(user.id)) {
      return next(ApiError.notAuthorized('Not allowed to edit revision.'));
    }

    const attachments = await documentService.uploadAttachments(req.files);
    const updatedDocument = await documentService.updateDocument({
      id: documentId,
      attachments,
      user,
      data,
      isRevisedDoc: true,
    });

    const users = getPeopleToAcknowledge(updatedDocument);

    await revisionService.assignAcknowledgements({
      revisionId: revision.id,
      users,
    });

    await historyService.createHistory({
      actor: user.id,
      action: DOCUMENT_ACTIONS.REVISED,
      department: user.department,
      document: documentId,
      content: remark,
    });

    sendSuccessResponse({
      data: updatedDocument,
      res,
    });
  });

  const commentOnDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.commentOnDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Commented on document.',
    });
  });

  const updateDocument = catchAsync(async (req, res, next) => {
    const attachments = await documentService.uploadAttachments(req.files);

    const updatedDocument = await documentService.updateDocument({
      id: req.params.id,
      attachments,
      user: req.user,
    });

    sendSuccessResponse({
      res,
      code: 201,
      data: updatedDocument,
      message: 'Document successfully updated.',
    });
  });

  const deleteDocument = catchAsync(async (req, res, next) => {
    const deletedDocument = await documentService.deleteDocument({
      id: req.params.id,
      user: req.user,
    });

    sendSuccessResponse({
      res,
      data: deletedDocument,
    });
  });

  const getDocumentsToCheck = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getDocumentsToCheck({
      user: req.user,
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getRequestedDocuments = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getAllDocuments({
      query: {
        ...req.query,
        currentReviewer: req.user.id,
      },
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getMyDocuments = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getAllDocuments({
      query: { ...req.query, requestedBy: req.user._id },
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getAllDocuments = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getAllDocuments({
      query: req.query,
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getDocumentsInFADSection = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getAllDocuments({
      query: {
        ...req.query,
        section: DOCUMENT_SECTIONS.fad,
      },
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getDocumentsInAdminSection = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getAllDocuments({
      query: {
        ...req.query,
        section: DOCUMENT_SECTIONS.admin,
      },
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getDocumentById = catchAsync(async (req, res, next) => {
    const document = await documentService.getDocumentById({
      id: req.params.id,
    });

    sendSuccessResponse({
      res,
      data: document,
    });
  });

  /**
   * This will return documents that
   * are approved by admin section
   * no matter the state of the documents
   */
  const getAdminApprovedDocuments = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getAllDocuments({
      query: {
        ...req.query,
        history: {
          action: DOCUMENT_ACTIONS.approve,
          section: DOCUMENT_SECTIONS.admin,
        },
      },
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  return {
    createDocument,
    prepareDocument,
    verifyDocument,
    approveDocument,
    requestRevision,
    reviseDocument,
    getDocumentsToCheck,
    commentOnDocument,
    getRequestedDocuments,
    getMyDocuments,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    getDocumentsInFADSection,
    getDocumentsInAdminSection,
    getAdminApprovedDocuments,
  };
};

module.exports = createDocumentController();
