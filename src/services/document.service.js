const {
  documentStatus,
  userRoles,
  documentSections,
  documentActions,
} = require('../constants');
const ApiError = require('../helpers/apiError');
const getQuery = require('../helpers/getQuery');
const uploadFile = require('../lib/s3');
const Document = require('../models/document.model');

const createDocumentService = () => {
  const _noDocumentError = ApiError.badRequest('Document does not exist.');

  const _canUserUpdateOrDelete = ({ document, user }) => {
    return (
      document.requestedBy.equals(user._id) ||
      user.role === userRoles.superadmin
    );
  };

  const _getFilterForGetAllDocs = ({ queryFilter }) => {
    const filter = {};

    if (queryFilter.status) {
      if (Array.isArray(queryFilter.status)) {
        filter.$or = queryFilter.status.map((value) => ({
          'state.status': value,
        }));
      } else {
        filter['state.status'] = queryFilter.status;
      }
    }

    if (queryFilter.section) {
      filter['state.section'] = queryFilter.section;
    }

    if (queryFilter.amount) {
      filter.amount = parseInt(queryFilter.amount, 10);
    }

    if (queryFilter.amountMin || queryFilter.amountMax) {
      filter.amount = {
        ...(queryFilter.amountMin && {
          $gte: parseInt(queryFilter.amountMin, 10),
        }),
        ...(queryFilter.amountMax && {
          $lte: parseInt(queryFilter.amountMax, 10),
        }),
      };
    }

    if (queryFilter.requestedBy) {
      filter.requestedBy = queryFilter.requestedBy;
    }

    if (queryFilter.history) {
      filter['remarks.action'] =
        queryFilter.history.action || documentActions.approve;
      filter['remarks.section'] =
        queryFilter.history.section || documentSections.admin;
    }

    return filter;
  };

  const createRequisitionDocument = async ({ files, ...data }) => {
    let attachments = [];

    if (Array.isArray(files)) {
      const uploadFiles = await Promise.all(
        files.map((file) => uploadFile(file))
      );

      attachments = uploadFiles.map((file) => ({
        url: file.Location,
        key: file.Key,
      }));
    }

    const document = await Document.create({ ...data, attachments });

    return document;
  };

  const verifyDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (
      document.state.status !== documentStatus.pending ||
      document.state.status !== documentStatus.verified
    ) {
      throw ApiError.badRequest('Cannot verify this document.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        'state.status': documentStatus.verified,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: documentActions.verify,
            section: document.state.section,
          },
        },
      },
      { new: true }
    );

    return newDocument;
  };

  const approveDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (
      !(
        document.state.status === documentStatus.verified ||
        document.state.status === documentStatus.pending
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
        'state.status': documentStatus.approved,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: documentActions.approve,
            section: document.state.section,
          },
        },
      },
      { new: true }
    );

    return newDocument;
  };

  const rejectDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (document.state.status !== documentStatus.pending) {
      throw ApiError.badRequest('Cannot reject the form.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        'state.status': documentStatus.rejected,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: documentActions.reject,
            section: document.state.section,
          },
        },
      },
      { new: true }
    );

    return newDocument;
  };

  const acknowledgeDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw _noDocumentError;
    }

    if (
      document.state.status !== documentStatus.approved ||
      document.state.section !== documentSections.fad
    ) {
      throw ApiError.badRequest('Cannot acknowledge the form.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        'state.status': documentStatus.acknowledged,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: documentActions.acknowledge,
            section: document.state.section,
          },
        },
      },
      { new: true }
    );

    return newDocument;
  };

  const submitToFAD = async ({ id, user }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw _noDocumentError;
    }

    if (!document.requestedBy.equals(user._id)) {
      throw ApiError.notAuthorized();
    }

    if (
      !(
        document.state.status === documentStatus.approved &&
        document.state.section === documentSections.admin
      )
    ) {
      throw ApiError.badRequest('Cannot submit to FAD yet.');
    }

    const submittedDocument = await Document.findByIdAndUpdate(
      id,
      {
        state: {
          status: documentStatus.pending,
          section: documentSections.fad,
        },
      },
      { new: true }
    );

    return submittedDocument;
  };

  const getDocumentById = async ({ id }) => {
    const document = await Document.findById(id)
      .populate('requestedBy')
      .populate('remarks.remarker');

    if (!document) {
      throw _noDocumentError;
    }

    return document;
  };

  const getAllDocuments = async ({ query }) => {
    const { skip, sort, limit, queryFilter } = getQuery(query);

    const filter = _getFilterForGetAllDocs({
      queryFilter,
    });

    const total = await Document.count(filter);

    const documents = await Document.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('requestedBy')
      .populate('remarks.remarker');

    return { total, documents };
  };

  const getAdminApprovedDocuments = async () => {
    const documents = await Document.find({
      'remarks.action': documentActions.approve,
      'remarks.section': documentSections.admin,
    });

    return { documents, total: documents.length };
  };

  const submitDraft = async ({ id }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw _noDocumentError;
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

  const updateDocument = async ({ id, data, user }) => {
    const isEmptyData = Object.keys(data).length === 0;

    if (isEmptyData) {
      throw ApiError.badRequest('No data provided.');
    }

    const document = await Document.findById(id);

    if (!document) {
      throw _noDocumentError;
    }

    if (
      document.state.status !== documentStatus.pending &&
      document.state.section !== documentSections.admin
    ) {
      throw ApiError.badRequest('Cannot update the document anymore.');
    }
    if (!_canUserUpdateOrDelete({ document, user })) {
      throw ApiError.notAuthorized();
    }

    const updatedDocument = await Document.findByIdAndUpdate(id, data);

    return updatedDocument;
  };

  const deleteDocument = async ({ id, user }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw _noDocumentError;
    }

    if (
      document.state.status !== documentStatus.pending &&
      document.state.section !== documentSections.admin
    ) {
      throw ApiError.badRequest('Cannot update the document anymore.');
    }

    if (!_canUserUpdateOrDelete({ document, user })) {
      throw ApiError.notAuthorized();
    }

    const deletedDocument = await Document.findByIdAndDelete(id);

    return deletedDocument;
  };

  return {
    createRequisitionDocument,
    verifyDocument,
    approveDocument,
    rejectDocument,
    acknowledgeDocument,
    getDocumentById,
    getAllDocuments,
    submitDraft,
    updateDocument,
    deleteDocument,
    submitToFAD,
    getAdminApprovedDocuments,
  };
};

module.exports = createDocumentService();
