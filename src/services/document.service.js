const { documentRemarkActions, documentStatus } = require('../constants');
const ApiError = require('../helpers/apiError');
const transformQuery = require('../helpers/transformQuery');
const Document = require('../models/document.model');

const createDocumentService = () => {
  const createRequisitionDocument = async (data) => {
    const document = await Document.create(data);

    return document;
  };

  const verifyDocument = async ({ id, userId, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== documentStatus.pending) {
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
      { new: true }
    );

    return newDocument;
  };

  const approveDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (
      !(
        document.status === documentStatus.verified ||
        document.status === documentStatus.pending
      )
    ) {
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
      { new: true }
    );

    return newDocument;
  };

  const rejectDocument = async ({ id, userId, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== documentStatus.pending) {
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
      { new: true }
    );

    return newDocument;
  };

  const acknowledgeDocument = async ({ id, userId, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== documentStatus.approved) {
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
      { new: true }
    );

    return newDocument;
  };

  const getRequestedDocuments = async ({ query }) => {
    const { skip, sort, limit } = transformQuery(query);

    const filter = {
      $or: [
        {
          status: documentStatus.pending,
        },
        { status: documentStatus.verified },
      ],
    };

    const total = await Document.count(filter);

    const documents = await Document.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    return { total, documents };
  };

  const getMyDocuments = async ({ userId, query }) => {
    const { skip, status, sort, limit } = transformQuery(query);

    const filter = {
      requestedBy: userId,
      ...(status ? { status } : undefined),
    };

    const total = await Document.count(filter);

    const documents = await Document.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    return { documents, total };
  };

  const getAllDocuments = async ({ query }) => {
    const { skip, sort, limit } = transformQuery(query);

    const total = await Document.count();

    const documents = await Document.find().skip(skip).limit(limit).sort(sort);

    return { total, documents };
  };

  const submitDraft = async ({ id }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== documentStatus.drafted) {
      throw ApiError.badRequest('Document is not drafted.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        status: documentStatus.pending,
      },
      { new: true }
    );

    return newDocument;
  };

  return {
    createRequisitionDocument,
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

module.exports = createDocumentService();
