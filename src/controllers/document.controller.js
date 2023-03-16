const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const documentService = require('../services/document.service');

const createDocumentController = () => {
  const createDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.createRequisitionDocument({
      ...req.body,
      requestedBy: req.user.id,
    });

    sendSuccessResponse({
      res,
      code: 201,
      data: document,
      message: 'Document successfully created.',
    });
  });

  const verifyDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.verifyDocument({
      id: req.params.id,
      userId: req.user.id,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document verified.',
    });
  });

  const approveDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.approveDocument({
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

  const rejectDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.rejectDocument({
      id: req.params.id,
      userId: req.user.id,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document rejected.',
    });
  });

  const acknowledgeDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.acknowledgeDocument({
      id: req.params.id,
      userId: req.user.id,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document acknowledged',
    });
  });

  const getRequestedDocuments = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getRequestedDocuments({
      query: req.query,
    });

    sendSuccessResponse({
      res,
      data: documents,
      total,
    });
  });

  const getMyDocuments = catchAsync(async (req, res, next) => {
    const { documents, total } = await documentService.getMyDocuments({
      userId: req.user.id,
      query: req.query,
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

  const submitDraft = catchAsync(async (req, res, next) => {
    const document = await documentService.submitDraft({ id: req.params.id });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document successfully submitted.',
    });
  });

  return {
    createDocument,
    verifyDocument,
    approveDocument,
    rejectDocument,
    acknowledgeDocument,
    getRequestedDocuments,
    getMyDocuments,
    getAllDocuments,
    submitDraft,
  };
};

module.exports = createDocumentController();
