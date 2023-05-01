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
const { AUTHORIZED_DEPARTMENTS } = require('../constants/user');

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
};

const createDocumentController = () => {
  const { extractReviewerIdList } = helpers;

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
        list: [
          {
            reviewer: officeAdmins[0]._id,
            index: 0,
            department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
            canPrepare: true,
            canEdit: true,
            canApprove: false,
          },
          {
            reviewer: officeAdmins[1]._id,
            index: 1,
            department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
            canPrepare: false,
            canEdit: false,
            canApprove: true,
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
    const { id } = req.params;
    const document = await documentService.prepareDocument({
      data: req.body,
      reviewerId: req.user._id,
      documentId: id,
    });

    const history = await historyService.createHistory({
      actor: req.user._id,
      action: DOCUMENT_ACTIONS.PREPARED,
      department: req.user.department,
      document: document.id,
    });

    document.histories.push(history);

    sendSuccessResponse({
      res,
      code: 201,
      data: document,
      message: 'Prepared the document.',
    });
  });

  const adminApproveDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.adminApproveDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document approved.',
    });
  });

  const adminVerifyDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.adminApproveDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
      action: DOCUMENT_ACTIONS.verify,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document verified.',
    });
  });

  const adminRejectDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.adminRejectDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({ res, data: document });
  });

  const submitDocumentToFAD = catchAsync(async (req, res, next) => {
    const fadReviewerIdList = extractReviewerIdList(req.body.fadReviewers);

    const invalidReviewer = await userService.getInvalidReviewer(
      fadReviewerIdList,
      DOCUMENT_SECTIONS.fad
    );

    if (invalidReviewer) {
      return next(
        ApiError.badRequest(
          `${invalidReviewer.name} is not eligible to be an FAD approval reviewer.`
        )
      );
    }
    const document = await documentService.submitToFAD({
      id: req.params.id,
      user: req.user,
      reviewers: req.body.fadReviewers,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Submitted to FAD',
    });
  });

  const fadApproveDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.fadApproveDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document approved.',
    });
  });

  const fadVerifyDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.fadApproveDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
      action: DOCUMENT_ACTIONS.verify,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document verified.',
    });
  });

  const fadRejectDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.fadRejectDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({ res, data: document, message: 'Document rejected.' });
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
    adminApproveDocument,
    adminVerifyDocument,
    adminRejectDocument,
    fadApproveDocument,
    fadVerifyDocument,
    fadRejectDocument,
    commentOnDocument,
    submitDocumentToFAD,
    getRequestedDocuments,
    getMyDocuments,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    getDocumentsInFADSection,
    getDocumentsInAdminSection,
    getAdminApprovedDocuments,
    prepareDocument,
  };
};

module.exports = createDocumentController();
