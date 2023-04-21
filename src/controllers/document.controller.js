const {
  documentStatus,
  documentSections,
  documentActions,
} = require('../constants');
const { DOCUMENT_SECTIONS } = require('../constants/document');
const ApiError = require('../helpers/apiError');
const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const documentService = require('../services/document.service');
const userService = require('../services/user.service');

const helpers = {
  extractAssigneeIdList: (assignees) => {
    return assignees.map((assignee) => assignee.userId);
  },
};

const createDocumentController = () => {
  const { extractAssigneeIdList } = helpers;

  /**
   * @deprecated
   */
  const verifyDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.verifyDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document verified.',
    });
  });

  /**
   * @deprecated
   */
  const acknowledgeDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.acknowledgeDocument({
      id: req.params.id,
      userId: req.user._id,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document acknowledged',
    });
  });

  /**
   * @deprecated
   */
  const rejectDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.rejectDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document rejected.',
    });
  });

  const createDocument = catchAsync(async (req, res, next) => {
    const adminAssigneeIdList = extractAssigneeIdList(req.body.adminAssignees);

    const invalidAssignee = await userService.getInvalidAssignee(
      adminAssigneeIdList,
      DOCUMENT_SECTIONS.admin
    );

    if (invalidAssignee) {
      return next(
        ApiError.badRequest(
          `${invalidAssignee.name} is not eligible to be an admin approval assignee.`
        )
      );
    }

    const attachments = await documentService.uploadAttachments(req.files);
    const document = await documentService.createRequisitionDocument({
      ...req.body,
      requestedBy: req.user._id,
      attachments,
    });

    sendSuccessResponse({
      res,
      code: 201,
      data: document,
      message: 'Document successfully created.',
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

  const adminRejectDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.adminRejectDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({ res, data: document });
  });

  const submitDocumentToFAD = catchAsync(async (req, res, next) => {
    const fadAssigneeIdList = extractAssigneeIdList(req.body.fadAssignees);

    const invalidAssignee = await userService.getInvalidAssignee(
      fadAssigneeIdList,
      DOCUMENT_SECTIONS.fad
    );

    if (invalidAssignee) {
      return next(
        ApiError.badRequest(
          `${invalidAssignee.name} is not eligible to be an FAD approval assignee.`
        )
      );
    }
    const document = await documentService.submitToFAD({
      id: req.params.id,
      user: req.user,
      assignees: req.body.fadAssignees,
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
    });
  });

  const fadRejectDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.fadRejectDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({ res, data: document });
  });

  const commentOnDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.commentOnDocument({
      id: req.params.id,
      user: req.user,
      remark: req.body.remark,
    });

    sendSuccessResponse({ res, data: document });
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
        status: [documentStatus.pending, documentStatus.verified],
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
        section: documentSections.fad,
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
        section: documentSections.admin,
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
          action: documentActions.approve,
          section: documentSections.admin,
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
    verifyDocument,
    adminApproveDocument,
    adminRejectDocument,
    fadApproveDocument,
    fadRejectDocument,
    commentOnDocument,
    rejectDocument,
    acknowledgeDocument,
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
  };
};

module.exports = createDocumentController();
