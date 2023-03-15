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

  return {
    createDocument,
  };
};

module.exports = createDocumentController();
