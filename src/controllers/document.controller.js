const {
  documentStatus,
  documentSections,
  documentActions,
} = require('../constants');
const ApiError = require('../helpers/apiError');
const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');
const assigneesGroupsService = require('../services/assignees-groups.service');
const documentService = require('../services/document.service');

const createDocumentController = () => {
  const createDocument = catchAsync(async (req, res, next) => {
    let assigneeGroup;

    if (req.body.assigneeGroupId) {
      assigneeGroup = await assigneesGroupsService.getAssigneeGroupById(
        req.body.assigneeGroupId
      );

      if (!assigneeGroup) {
        throw ApiError('Assignee Group does not exist.');
      }
    }

    const attachments = await documentService.uploadAttachments(req.files);
    const document = await documentService.createRequisitionDocument({
      ...req.body,
      requestedBy: req.user._id,
      attachments,
      adminAssignees: [...assigneeGroup.assignees],
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
      user: req.user,
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
      user: req.user,
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
      userId: req.user._id,
      remark: req.body.remark,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document acknowledged',
    });
  });

  const submitDocumentToFAD = catchAsync(async (req, res, next) => {
    const document = await documentService.submitToFAD({
      id: req.params.id,
      user: req.user,
    });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Submitted to FAD',
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

  const submitDraft = catchAsync(async (req, res, next) => {
    const document = await documentService.submitDraft({ id: req.params.id });

    sendSuccessResponse({
      res,
      data: document,
      message: 'Document successfully submitted.',
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

  return {
    createDocument,
    verifyDocument,
    approveDocument,
    rejectDocument,
    acknowledgeDocument,
    submitDocumentToFAD,
    getRequestedDocuments,
    getMyDocuments,
    getAllDocuments,
    getDocumentById,
    submitDraft,
    updateDocument,
    deleteDocument,
    getDocumentsInFADSection,
    getDocumentsInAdminSection,
    getAdminApprovedDocuments,
  };
};

module.exports = createDocumentController();
