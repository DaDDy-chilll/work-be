const {
  documentStatus,
  userRoles,
  documentSections,
  documentActions,
} = require('../constants');
const {
  DOCUMENT_STATUSES,
  DOCUMENT_SECTIONS,
  DOCUMENT_ACTIONS,
} = require('../constants/document');
const ApiError = require('../helpers/apiError');
const getQuery = require('../helpers/getQuery');
const { uploadFile } = require('../lib/s3');
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

  const uploadAttachments = async (files) => {
    if (Array.isArray(files)) {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const uploadedFile = await uploadFile(file);

          return {
            key: uploadedFile.Key,
            url: uploadedFile.Location,
            filename: file.originalname,
            mimetype: file.mimetype,
          };
        })
      );

      return uploadedFiles;
    }

    return [];
  };

  const createRequisitionDocument = async (data) => {
    const sortedAssigneesByOrder = data.adminAssignees.sort(
      (a, b) => a.order - b.order
    );

    return await Document.create({
      ...data,
      state: {
        status: DOCUMENT_STATUSES.pending,
        section: DOCUMENT_SECTIONS.admin,
        currentAssignee: sortedAssigneesByOrder[0].userId,
      },
    });
  };

  /**
   * @deprecated
   */
  const verifyDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (
      !(
        document.state.status === documentStatus.pending ||
        document.state.status === documentStatus.verified
      )
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

  /**
   * - Update state.nextAssignee with next assignee user id
   * by checking orders
   * - update current assignee's hasApproved in adminAssignees
   * - If there is no next assignee, update the doc state to
   * admin approved.
   */
  const adminApproveDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (document.state.status !== DOCUMENT_STATUSES.pending) {
      throw ApiError.badRequest('Document has already been approved.');
    }

    if (!document.state.currentAssignee.equals(user._id)) {
      throw ApiError.badRequest('Not allowed to approve this document.');
    }

    const currentAssigneeOrder = document.adminAssignees.find((assignee) =>
      assignee.userId.equals(document.state.currentAssignee)
    ).order;

    if (!currentAssigneeOrder) {
      throw ApiError.badRequest('Current assignee does not exist.');
    }

    const nextAssignee = document.adminAssignees.find(
      (assignee) => assignee.order === currentAssigneeOrder + 1
    );

    const newDocument = await Document.findOneAndUpdate(
      {
        _id: id,
        'adminAssignees.userId': user._id,
      },
      {
        // if there is no assignee left,
        // consider the document to be 100% approved
        // by admin dept
        'state.status': nextAssignee
          ? DOCUMENT_STATUSES.pending
          : DOCUMENT_STATUSES.approved,
        'state.nextAssignee': nextAssignee?.userId || null,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: DOCUMENT_ACTIONS.approve,
            section: document.state.section,
          },
        },
        $set: {
          'adminAssignees.$.hasApproved': true,
        },
      },
      {
        new: true,
      }
    );

    return newDocument;
  };

  const adminRejectDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (document.state.status !== DOCUMENT_STATUSES.pending) {
      throw ApiError.badRequest('Cannot reject the document.');
    }

    if (!document.state.nextAssignee.equals(user._id)) {
      throw ApiError.badRequest('Cannot reject the document.');
    }

    const newDocument = await Document.findByIdAndUpdate(
      id,
      {
        'state.status': DOCUMENT_STATUSES.rejected,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: DOCUMENT_ACTIONS.reject,
            section: document.state.section,
          },
        },
      },
      {
        new: true,
      }
    );

    return newDocument;
  };

  /**
   * @deprecated
   */
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

    if (!document.state.nextAssignee.equals(user._id)) {
      throw ApiError.badRequest('Not allowed to approve this document yet.');
    }

    const currentAssignees =
      document.state.section === DOCUMENT_SECTIONS.admin
        ? [...document.adminAssignees]
        : [...document.fadAssignees];

    const currentAssigneeOrder = currentAssignees.find((assignee) =>
      assignee.userId.equals(user._id)
    ).order;

    const nextAssignee = currentAssignees.find(
      (assignee) => assignee.order === currentAssigneeOrder + 1
    );

    const assigneeField =
      document.state.section === DOCUMENT_SECTIONS.admin
        ? 'adminAssignees'
        : 'fadAssignees';

    const newDocument = await Document.findOneAndUpdate(
      { id, [`${assigneeField}.userId`]: user._id },
      {
        'state.status': documentStatus.approved,
        'state.nextAssignee': nextAssignee ?? null,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: documentActions.approve,
            section: document.state.section,
          },
        },
        $set: {
          [`${assigneeField}.$.hasApproved`]: true,
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

  /**
   * @deprecated
   */
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

  /**
   * @deprecated
   */
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

  const updateDocument = async ({ id, attachments, user, data = {} }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw _noDocumentError;
    }

    if (!_canUserUpdateOrDelete({ document, user })) {
      throw ApiError.notAuthorized();
    }

    await document.updateOne({
      ...data,
      $push: {
        attachments: {
          $each: attachments,
        },
      },
    });

    return document;
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
    uploadAttachments,
    adminApproveDocument,
    adminRejectDocument,
  };
};

module.exports = createDocumentService();
