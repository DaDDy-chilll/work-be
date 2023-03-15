const { documentRemarkActions, documentStatus } = require('../constants');
const ApiError = require('../helpers/apiError');
const Document = require('../models/document.model');

const createDocumentService = () => {
  const createRequisitionForm = async (data) => {
    const document = await Document.create(data);

    return document;
  };

  // TODO: Do not verify a doucment that's already been verified
  // or rejected or approved.
  const verifyForm = async ({ id, userId, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== 'Pending') {
      throw ApiError.badRequest('Cannot verify this document.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        status: documentStatus.verified,
        $push: {
          remarks: {
            remarker: userId,
            content: remark,
            action: documentRemarkActions.verify,
          },
        },
      },
      { new: true },
    );

    return newDocument;
  };

  const approveForm = async ({ id, userId, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== 'Verified') {
      throw ApiError.badRequest('Cannot approve this document.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        status: documentStatus.approved,
        $push: {
          remarks: {
            remarker: userId,
            content: remark,
            action: documentRemarkActions.approve,
          },
        },
      },
      { new: true },
    );

    return newDocument;
  };

  const rejectForm = async ({ id, userId, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== 'Pending') {
      throw ApiError.badRequest('Cannot reject the form.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        status: documentStatus.rejected,
        $push: {
          remarks: {
            remarker: userId,
            content: remark,
            action: documentRemarkActions.reject,
          },
        },
      },
      { new: true },
    );

    return newDocument;
  };

  return {
    createRequisitionForm,
    verifyForm,
    approveForm,
    rejectForm,
  };
};

module.exports = createDocumentService();
