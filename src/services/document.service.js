const { isObjectIdOrHexString } = require('mongoose');
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
  STATUS_ACTION_MAP,
} = require('../constants/document');
const ApiError = require('../helpers/apiError');
const getQuery = require('../helpers/getQuery');
const { uploadFile } = require('../lib/s3');
const Document = require('../models/document.model');
const {
  AUTHORIZED_DEPARTMENTS,
  DEPARTMENT_LEVELS,
} = require('../constants/user');

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

    if (
      queryFilter.currentReviewer &&
      isObjectIdOrHexString(queryFilter.currentReviewer)
    ) {
      filter['state.currentReviewer'] = queryFilter.currentReviewer;
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
    const document = new Document(data);

    await document.save();

    return document;
  };

  const prepareDocument = async ({
    data,
    reviewerId,
    document,
    remark,
    reviewerPermissions,
  }) => {
    if (!reviewerPermissions.canPrepare) {
      throw ApiError.badRequest('Cannot prepare the document.');
    }

    await document.updateOne(
      {
        ...data,
        $inc: {
          'reviewers.currentReviewerIndex': 1,
        },
        $push: {
          remarks: {
            ...(remark && { content: remark }),
            remarker: reviewerId,
            action: DOCUMENT_ACTIONS.PREPARED,
          },
        },
      },
      { new: true, runValidators: true }
    );

    return document;
  };

  const verifyDocument = async ({
    reviewerId,
    document,
    remark,
    reviewerPermissions,
  }) => {
    if (!reviewerPermissions.canVerify) {
      throw ApiError.badRequest('Cannot verify the document.');
    }

    await document.updateOne(
      {
        $inc: {
          'reviewers.currentReviewerIndex': 1,
        },
        $push: {
          remarks: {
            ...(remark && { content: remark }),
            remarker: reviewerId,
            action: DOCUMENT_ACTIONS.VERIFIED,
          },
        },
      },
      { new: true, runValidators: true }
    );

    return document;
  };

  const assignReviewerGroup = async ({ documentId, list }) => {
    const document = await Document.findById(documentId);

    document.reviewers.currentReviewerIndex = 0;
    document.reviewers.list.push([...list]);

    await document.save();

    return document;
  };

  const approveDocument = async ({
    reviewerId,
    document,
    remark,
    reviewerPermissions,
    group,
  }) => {
    if (!reviewerPermissions.canApprove) {
      throw ApiError.badRequest('Cannot approve the document.');
    }

    const isCurrentFAD =
      document.reviewers.currentDepartment === AUTHORIZED_DEPARTMENTS.FAD;

    let nextDepartment;

    if (!isCurrentFAD) {
      const currentLevel =
        DEPARTMENT_LEVELS[document.reviewers.currentDepartment];

      nextDepartment = DEPARTMENT_LEVELS[currentLevel + 1];
    }

    await document.updateOne(
      {
        ...(!isCurrentFAD && {
          'reviewers.currentDepartment': nextDepartment,
          'reviewers.currentReviewerIndex': 0,
        }),
        ...(isCurrentFAD && {
          status: DOCUMENT_STATUSES.APPROVED,
        }),
        $push: {
          remarks: {
            ...(remark && { content: remark }),
            remarker: reviewerId,
            action: DOCUMENT_ACTIONS.APPROVED,
          },
        },
        ...(group && {
          $push: {
            'reviewers.list': {
              $each: group.reviewers,
            },
          },
        }),
      },
      { new: true, runValidators: true }
    );

    return document;
  };

  const adminRejectDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (document.state.status !== DOCUMENT_STATUSES.pending) {
      throw ApiError.badRequest('Cannot reject the document.');
    }

    if (!document.state.currentReviewer.equals(user._id)) {
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
        $set: {
          'adminReviewers.$.action': 'rejected',
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return newDocument;
  };

  const submitToFAD = async ({ id, user, reviewers }) => {
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

    const sortedReviewersByOrder = reviewers.sort((a, b) => a.order - b.order);

    const submittedDocument = await Document.findByIdAndUpdate(
      id,
      {
        state: {
          status: DOCUMENT_STATUSES.pending,
          section: DOCUMENT_SECTIONS.fad,
          currentReviewer: sortedReviewersByOrder[0].user,
        },
        fadReviewers: sortedReviewersByOrder,
      },
      { new: true, runValidators: true }
    );

    return submittedDocument;
  };

  const fadApproveDocument = async ({
    id,
    user,
    remark,
    action = DOCUMENT_ACTIONS.approve,
  }) => {
    const document = await Document.findById(id);

    if (document.state.status !== DOCUMENT_STATUSES.pending) {
      throw ApiError.badRequest('Document has already been approved.');
    }

    if (!document.state.currentReviewer.equals(user._id)) {
      throw ApiError.badRequest('Not allowed to approve this document.');
    }

    const currentReviewerOrder = document.fadReviewers.find((reviewer) =>
      reviewer.user.equals(document.state.currentReviewer)
    )?.order;

    if (typeof currentReviewerOrder === 'undefined') {
      throw ApiError.badRequest('Current reviewer does not exist.');
    }

    const nextReviewer = document.fadReviewers.find(
      (reviewer) => reviewer.order === currentReviewerOrder + 1
    );

    const nextStatus =
      action === DOCUMENT_ACTIONS.approve
        ? DOCUMENT_STATUSES.approved
        : DOCUMENT_STATUSES.verified;

    const newDocument = await Document.findOneAndUpdate(
      {
        _id: id,
        'fadReviewers.user': user._id,
      },
      {
        // if there is no reviewer left,
        // consider the document to be 100% approved
        // by fad dept
        'state.status': nextReviewer ? DOCUMENT_STATUSES.pending : nextStatus,
        'state.currentReviewer': nextReviewer?.user || null,
        $push: {
          remarks: {
            remarker: user._id,
            content: remark,
            action: DOCUMENT_ACTIONS.approve,
            section: document.state.section,
          },
        },
        $set: {
          'fadReviewers.$.action': STATUS_ACTION_MAP[action],
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return newDocument;
  };

  const fadRejectDocument = async ({ id, user, remark }) => {
    const document = await Document.findById(id);

    if (document.state.status !== DOCUMENT_STATUSES.pending) {
      throw ApiError.badRequest('Cannot reject the document.');
    }

    if (!document.state.currentReviewer.equals(user._id)) {
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
        $set: {
          'fadReviewers.$.action': 'rejected',
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return newDocument;
  };

  const commentOnDocument = async ({ id, remark, user }) => {
    const document = await Document.findById(id);

    if (document.state.status !== DOCUMENT_STATUSES.pending) {
      throw ApiError.badRequest('Document has already been approved.');
    }

    if (document.state.currentReviewer.equals(user._id)) {
      throw ApiError.badRequest('You are not allowed to comment.');
    }

    document.remarks.push({
      remarker: user._id,
      content: remark,
      action: DOCUMENT_ACTIONS.comment,
      section: document.state.section,
    });

    await document.save();

    return document;
  };

  const getDocumentById = async ({ id }) => {
    const document = await Document.findById(id)
      .populate('requestedBy')
      .populate('remarks.remarker')
      .populate('adminReviewers.user')
      .populate('fadReviewers.user')
      .populate('state.currentReviewer');

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
      .populate('requester');

    return { total, documents };
  };

  const getAdminApprovedDocuments = async () => {
    const documents = await Document.find({
      'remarks.action': documentActions.approve,
      'remarks.section': documentSections.admin,
    });

    return { documents, total: documents.length };
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
    prepareDocument,
    verifyDocument,
    approveDocument,
    getDocumentById,
    getAllDocuments,
    updateDocument,
    deleteDocument,
    submitToFAD,
    getAdminApprovedDocuments,
    uploadAttachments,
    adminRejectDocument,
    fadApproveDocument,
    fadRejectDocument,
    commentOnDocument,
  };
};

module.exports = createDocumentService();
