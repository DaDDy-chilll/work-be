const { documentRemarkActions, documentStatus } = require('../constants');
const ApiError = require('../helpers/apiError');
const Document = require('../models/document.model');

const createDocumentService = () => {
  const createRequisitionDocument = async (data) => {
    const document = await Document.create(data);

    return document;
  };

  // TODO: Do not verify a doucment that's already been verified
  // or rejected or approved.
  const verifyDocument = async ({ id, userId, remark }) => {
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

  const approveDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== 'Verified') {
      throw ApiError.badRequest('Cannot approve this document.');
    }

    if (document.amount > user.approvalAmount) {
      throw ApiError.badRequest('Amount too high to approve.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        status: documentStatus.approved,
        $push: {
          remarks: {
            remarker: user.id,
            content: remark,
            action: documentRemarkActions.approve,
          },
        },
      },
      { new: true },
    );

    return newDocument;
  };

  const rejectDocument = async ({ id, userId, remark }) => {
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

  const acknowledgeDocument = async ({ id, userId, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    console.log(document.status);

    if (document.status !== 'Approved') {
      throw ApiError.badRequest('Cannot acknowledge the form.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        status: documentStatus.acknowledged,
        $push: {
          remarks: {
            remarker: userId,
            content: remark,
            action: documentRemarkActions.acknowledge,
          },
        },
      },
      { new: true },
    );

    return newDocument;
  };

  const getRequestedDocuments = async ({ query }) => {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * 10;

    const documents = await Document.find({
      $or: [
        {
          status: 'Pending',
        },
        { status: 'Verified' },
      ],
    })
      .skip(skip)
      .limit(10);

    return documents;
  };

  return {
    createRequisitionDocument,
    verifyDocument,
    approveDocument,
    rejectDocument,
    acknowledgeDocument,
    getRequestedDocuments,
  };
};

module.exports = createDocumentService();
