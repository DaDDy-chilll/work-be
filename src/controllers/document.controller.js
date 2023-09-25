const { DOCUMENT_TYPES, DOCUMENT_STATUSES } = require('../constants/document');
const catchAsync = require('../utils/catchAsync');
const sendSuccessResponse = require('../utils/sendSuccessResponse');

/**
 * @typedef {Object} Dependencies
 * @property {ReturnType<import('../services/document.service')>} documentService
 *
 * @param {Dependencies} dependencies
 * @returns
 */
module.exports = ({ documentService }) => {
  const createDocument = catchAsync(async (req, res, next) => {
    const { originalDocumentId, ...body } = req.body;
    const document = await documentService.createRequisitionDocument({
      body,
      requester: req.user,
      files: req.files,
      originalDocumentId,
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
      files: req.files,
    });

    sendSuccessResponse({ res, code: 200, data: document });
  });

  const chooseWorkflow = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { workflowId } = req.body;
    const documentId = req.params.id;

    await documentService.chooseWorkflowForDocument({
      workflowId,
      documentId,
      user,
    });

    sendSuccessResponse({
      res,
      code: 200,
    });
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
    const { id: documentId } = req.params;
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

  const acknowledgeRevision = catchAsync(async (req, res, next) => {
    const { documentId, revisionId } = req.params;
    const userId = req.user._id;

    const document = await documentService.acknowledgeDocument({
      documentId,
      revisionId,
      userId,
    });

    sendSuccessResponse({
      data: document,
      res,
    });
  });

  const rejectDocument = catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const userId = req.user.id;
    const document = await documentService.rejectDocument({
      documentId: id,
      userId: userId,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
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
        isCaseClosed: false,
      },
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getDocumentsToAcknowledge = catchAsync(async (req, res, next) => {
    const documents = await documentService.getDocumentsToAcknowledge({
      userId: req.user.id,
    });

    sendSuccessResponse({
      res,
      data: documents,
      total: documents.length,
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
      user: req.user,
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

    let claimDocId;
    if (
      document.type === DOCUMENT_TYPES.ADVANCE &&
      document.status === DOCUMENT_STATUSES.APPROVED
    ) {
      claimDocId = await documentService.getClaimDocumentIdByOriginalId({
        originalId: document.id,
      });
    }

    const shapedDoc = {
      hasClaim: !!claimDocId,
      claimDocumentId: claimDocId,
      ...document.toObject({ getters: true }),
    };

    sendSuccessResponse({
      res,
      data: shapedDoc,
    });
  });

  return {
    createDocument,
    requestRevision,
    reviseDocument,
    acknowledgeRevision,
    getDocumentsToCheck,
    getDocumentsToAcknowledge,
    commentOnDocument,
    getCurrentUserDocuments,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    invokeDocumentAction,
    rejectDocument,
    chooseWorkflow,
  };
};
