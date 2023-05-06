const { isObjectIdOrHexString } = require('mongoose');
const {
  DOCUMENT_SECTIONS,
  DOCUMENT_ACTIONS,
} = require('../constants/document');
const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const { DEPARTMENT_LEVELS } = require('../constants/user');
const createDocumentService = require('../services/document.service');
const createHistoryService = require('../services/history.service');
const createRevisionService = require('../services/revision.service');

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
  const documentService = createDocumentService({
    historyService: createHistoryService(),
    revisionService: createRevisionService(),
  });

  const createDocument = catchAsync(async (req, res, next) => {
    const document = documentService.createRequisitionDocument({
      body: req.body,
      requester: req.user,
      files: req.files,
    });

    sendSuccessResponse({
      res,
      code: 201,
      data: document,
      message: 'Document successfully created.',
    });
  });

  const invokeDocumentAction = catchAsync(async (req, res, next) => {
    const { action, id } = req.params;
    const { remark, ...body } = req.body;

    const document = await documentService.invokeDocumentAction({
      action,
      body,
      documentId: id,
      remark,
      reviewer: req.user,
    });

    sendSuccessResponse({ res, code: 200, data: document });
  });

  const requestRevision = catchAsync(async (req, res, next) => {
    // Department to revis
    const { department, remark } = req.body;
    const { id } = req.params;

    const document = await documentService.requestRevision({
      reviewer: req.user,
      documentId: id,
      department,
      remark,
    });

    sendSuccessResponse({
      res,
      code: 201,
      data: document,
      message: 'Successfully requested revision.',
    });
  });

  const reviseDocument = catchAsync(async (req, res, next) => {
    const { id: documentId } = req.params.id;
    const user = req.user;
    const { remark, ...data } = req.body;

    const document = await documentService.reviseDocument({
      body: data,
      documentId,
      files: req.files,
      remark,
      reviewer: user,
    });

    sendSuccessResponse({
      data: document,
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

  const getCurrentUserDocuments = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getAllDocuments({
      query: { ...req.query, requester: req.user._id },
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

  const getDocumentById = catchAsync(async (req, res, next) => {
    const document = await documentService.getDocumentById({
      id: req.params.id,
    });

    sendSuccessResponse({
      res,
      data: document,
    });
  });

  return {
    createDocument,
    requestRevision,
    reviseDocument,
    getDocumentsToCheck,
    commentOnDocument,
    getCurrentUserDocuments,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    invokeDocumentAction,
  };
};

module.exports = createDocumentController();
