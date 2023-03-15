const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const documentService = require('../services/document.service');

const createDocumentController = () => {
  const createDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.createRequisitionForm({
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
    const document = await documentService.verifyForm({
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
    const document = await documentService.approveForm({
      id: req.params.id,
      userId: req.user.id,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document approved.',
    });
  });

  const rejectDocument = catchAsync(async (req, res, next) => {
    const document = await documentService.rejectForm({
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
    const document = await documentService.acknowledgeForm({
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

  return {
    createDocument,
    verifyDocument,
    approveDocument,
    rejectDocument,
    acknowledgeDocument,
  };
};

module.exports = createDocumentController();
