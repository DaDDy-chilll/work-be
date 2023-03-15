const { documentRemarkActions, documentStatus } = require('../constants');
const ApiError = require('../helpers/apiError');
const Document = require('../models/document.model');

const createDocumentService = () => {
  const LIMIT = 10;

  const _getDocsSkip = (page = 1) => {
    return (parseInt(page, 10) - 1) * LIMIT;
  };

  const createRequisitionDocument = async (data) => {
    const document = await Document.create(data);

    return document;
  };

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

    if (!(document.status === 'Verified' || document.status === 'Pending')) {
      throw ApiError.badRequest('Cannot approve this document.');
    }

    console.log(user);

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
    const skip = _getDocsSkip(query.page);

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

  const getMyDocuments = async ({ userId, query }) => {
    const skip = _getDocsSkip(query.page);

    const documents = await Document.find({
      requestedBy: userId,
      ...(query.status ? { status: query.status } : undefined),
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
    getMyDocuments,
  };
};

module.exports = createDocumentService();
