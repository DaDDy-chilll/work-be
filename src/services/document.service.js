const { documentStatus, userRoles, documentSections } = require('../constants');
const {
  DOCUMENT_STATUSES,
  DOCUMENT_ACTIONS,
  DOCUMENT_TYPES,
} = require('../constants/document');
const ApiError = require('../helpers/apiError');
const getQuery = require('../helpers/getQuery');
const { uploadFile } = require('../lib/s3');
const {
  AUTHORIZED_DEPARTMENTS,
  DEPARTMENT_LEVELS,
} = require('../constants/user');

module.exports = ({
  historyService,
  revisionService,
  notificationService,
  userService,
  Document,
  ReviewerGroup,
}) => {
  const _noDocumentError = ApiError.badRequest('Document does not exist.');

  // Private methods
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
          status: value,
        }));
      } else {
        filter.status = queryFilter.status;
      }
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

    if (queryFilter.requester) {
      filter.requester = queryFilter.requester;
    }

    if (queryFilter.currentReviewer) {
      filter.currentReviewer = queryFilter.currentReviewer;
    }

    if (queryFilter.caseStatus) {
      filter.isCaseClosed = queryFilter.caseStatus === 'closed';
    }

    if (queryFilter.type) {
      filter.type = queryFilter.type;
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

  const prepareUpdater = async ({ body, files }) => {
    const attachments = await uploadAttachments(files);
    return {
      ...body,
      $push: {
        attachments: {
          $each: attachments,
        },
      },
    };
  };

  // Currently empty
  const verifyUpdater = () => {
    return {};
  };

  const approveUpdater = async ({ document, groupId }) => {
    const update = {};
    let group;
    let addedReviewers;

    const isCurrentFAD =
      document.reviewers.currentDepartment === AUTHORIZED_DEPARTMENTS.FAD;

    if (
      document.reviewers.currentDepartment ===
      AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN
    ) {
      group = await ReviewerGroup.findById(groupId).populate(
        'reviewers.reviewer'
      );
      if (!group) {
        throw ApiError.badRequest('Group does not exist.');
      }

      addedReviewers = group.reviewers
        .map((item) => {
          const index = item.index + document.reviewers.list.length;
          return {
            ...item.reviewer.permissions,
            index,
            reviewer: item.reviewer.id,
            department: item.department,
          };
        })
        .sort((a, b) => {
          if (a.index < b.index) {
            return -1;
          } else if (b.index < a.index) {
            return 1;
          } else {
            return 0;
          }
        });

      update.$push = {
        'reviewers.list': {
          $each: addedReviewers,
        },
      };

      update['reviewers.currentReviewerIndex'] = addedReviewers[0].index;
      update['reviewers.currentDepartment'] = addedReviewers[0].department;
      update.currentReviewer = addedReviewers[0].reviewer;
    } else if (isCurrentFAD) {
      update.status = DOCUMENT_STATUSES.APPROVED;

      if (document.isClaimDocument) {
        update.isCaseClosed = true;
      }

      if (document.type === DOCUMENT_TYPES.EXPENSE) {
        update.isCaseClosed = true;
      }
    }

    return update;
  };

  // Public Methods
  const createRequisitionDocument = async ({
    body,
    requester,
    files,
    originalDocumentId = undefined,
  }) => {
    if (body.type === DOCUMENT_TYPES.CLAIM) {
      const orgDoc = await Document.findById(originalDocumentId);

      if (!orgDoc) {
        throw ApiError.badRequest('Original document not found.');
      }

      if (orgDoc.type !== DOCUMENT_TYPES.ADVANCE) {
        throw ApiError.badRequest('Only advance document can be claimed.');
      }

      if (orgDoc.status !== DOCUMENT_STATUSES.APPROVED) {
        throw ApiError.badRequest('Original document is not yet approved.');
      }

      const pastClaimDocument = await Document.findOne({
        originalDocument: originalDocumentId,
      });

      if (pastClaimDocument) {
        throw ApiError.badRequest(
          'Original document already has a claim document.'
        );
      }
    }

    const { users: officeAdmins } = await userService.getAllUsers({
      filter: {
        department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
      },
    });

    if (officeAdmins.length < 2) {
      throw ApiError.badRequest();
    }

    const attachments = await uploadAttachments(files);

    const document = new Document({
      ...body,
      attachments,
      requester: requester.id,
      status: DOCUMENT_STATUSES.PENDING,
      reviewers: {
        list: [
          {
            reviewer: officeAdmins[0]._id,
            index: 0,
            department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
            canPrepare: true,
            canEdit: true,
            canApprove: false,
            canVerify: true,
          },
          {
            reviewer: officeAdmins[1]._id,
            index: 1,
            department: AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN,
            canPrepare: false,
            canEdit: false,
            canApprove: true,
            canVerify: false,
          },
        ],
      },
      currentReviewer: officeAdmins[0].id,
      isClaimDocument: body.type === DOCUMENT_TYPES.CLAIM,
      ...(originalDocumentId && { originalDocument: originalDocumentId }),
    });

    await document.save();

    await historyService.createHistory({
      actor: requester.id,
      department: requester.department,
      action: DOCUMENT_ACTIONS.SUBMITTED,
      document: document.id,
    });

    await notificationService.createNotification({
      to: document.currentReviewer,
      from: document.requester,
      action: DOCUMENT_ACTIONS.SUBMITTED,
      documentId: document.id,
    });

    return document;
  };

  const invokeDocumentAction = async ({
    action,
    body,
    reviewer,
    documentId,
    remark,
    files,
  }) => {
    const document = await Document.findById(documentId).populate(
      'reviewers.list.reviewer'
    );

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.status !== DOCUMENT_STATUSES.PENDING) {
      throw ApiError.badRequest('Cannot perform this action.');
    }

    const mapping = {
      prepare: DOCUMENT_ACTIONS.PREPARED,
      verify: DOCUMENT_ACTIONS.VERIFIED,
      approve: DOCUMENT_ACTIONS.APPROVED,
      comment: DOCUMENT_ACTIONS.COMMENTED,
    };

    // Check if it's reviewer's turn
    const currentIndex = document.reviewers.currentReviewerIndex;
    const currentReviewerItem = document.reviewers.list.find(
      ({ reviewer: reviewerId, index }) =>
        index === currentIndex && reviewerId.equals(reviewer.id)
    );

    if (!currentReviewerItem) {
      throw ApiError.notAuthorized(`Cannot perform ${action}.`);
    }
    let updater;
    if (action === 'prepare' && currentReviewerItem.canPrepare) {
      updater = await prepareUpdater({ body, files });
    } else if (action === 'verify' && currentReviewerItem.canVerify) {
      updater = verifyUpdater();
    } else if (action === 'approve' && currentReviewerItem.canApprove) {
      updater = await approveUpdater({ document, groupId: body.groupId });
    } else if (action === 'comment') {
      updater = {
        currentReviewer: currentReviewerItem.reviewer,
        'reviewers.currentReviewerIndex': currentReviewerItem.index,
        'reviewers.currentDepartment': currentReviewerItem.department,
      };
    } else {
      throw ApiError.notAuthorized('Not allowed to perform this action.');
    }

    let nextReviewerItem = document.reviewers.list.find(
      ({ index }) => index === currentIndex + 1
    );

    // TODO: REFACTOR
    await Document.findOneAndUpdate(
      {
        _id: document.id,
        'reviewers.list.index': currentIndex,
      },
      {
        currentReviewer: nextReviewerItem?.reviewer,
        'reviewers.currentReviewerIndex': nextReviewerItem?.index || 0,
        'reviewers.currentDepartment': nextReviewerItem?.department,
        remark,
        ...updater,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    const updatedDocument = await Document.findOneAndUpdate(
      {
        _id: document.id,
        'reviewers.list.index': currentIndex,
      },
      {
        $set: {
          'reviewers.list.$.status':
            action === 'comment' ? 'PENDING' : mapping[action],
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );

    if (
      updatedDocument.type === 'CLAIM' &&
      updatedDocument.status === 'APPROVE'
    ) {
      const orgDocument = await Document.findById(
        updatedDocument.originalDocument
      );

      orgDocument.isCaseClosed = true;

      await orgDocument.save();
    }

    await historyService.createHistory({
      actor: reviewer.id,
      action: mapping[action],
      department: reviewer.department,
      document: updatedDocument.id,
      content: remark,
    });

    await notificationService.createNotification({
      to: updatedDocument.requester,
      from: reviewer.id,
      action: mapping[action],
      documentId: updatedDocument.id,
    });

    return updatedDocument;
  };

  const requestRevision = async ({
    reviewer,
    documentId,
    department,
    remark,
  }) => {
    const document = await Document.findById(documentId);
    if (document.status !== DOCUMENT_STATUSES.PENDING) {
      throw ApiError.badRequest('Document must be in pending status.');
    }
    // basically OA won't request a revision
    if (reviewer.department === AUTHORIZED_DEPARTMENTS.OFFICE_ADMIN) {
      throw ApiError.badRequest();
    }

    if (!reviewer._id.equals(document.currentReviewer)) {
      throw ApiError.notAuthorized();
    }

    const requesterDeptLevel = DEPARTMENT_LEVELS[reviewer.department];
    const requestedDepartmentLevel = DEPARTMENT_LEVELS[department];

    if (requesterDeptLevel <= requestedDepartmentLevel) {
      throw ApiError.badRequest(
        'Can only request revision to lower departments.'
      );
    }

    const revisorItem = document.reviewers.list.find(
      (item) => item.department === department && item.canEdit
    );

    if (!revisorItem) {
      throw ApiError.badRequest(
        `No person in ${department} eligible to revise.`
      );
    }

    const activeRevision = await revisionService.getActiveRevision({
      documentId: document.id,
    });

    if (activeRevision) {
      throw ApiError.badRequest("There's already an ongoing revision.");
    }

    document.status = DOCUMENT_STATUSES.REQUESTED_REVISION;
    document.currentReviewer = revisorItem.reviewer;

    const saveDocument = document.save();
    const saveHistory = historyService.createHistory({
      actor: reviewer.id,
      action: DOCUMENT_ACTIONS.REQUESTED_REVISION,
      department: department,
      document: document.id,
      content: remark,
    });

    const [, history] = await Promise.all([saveDocument, saveHistory]);

    await revisionService.createRevision({
      documentId: document.id,
      requester: reviewer,
      reviewer: {
        id: revisorItem.reviewer,
        department: revisorItem.department,
      },
      historyId: history.id,
    });

    await notificationService.createNotification({
      to: revisorItem.reviewer,
      from: reviewer.id,
      action: DOCUMENT_ACTIONS.REQUESTED_REVISION,
      documentId: document.id,
    });

    return document;
  };

  const reviseDocument = async ({
    documentId,
    reviewer,
    body,
    remark,
    files,
  }) => {
    const document = await Document.findById(documentId);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (!document.currentReviewer.equals(reviewer.id)) {
      throw ApiError.notAuthorized();
    }

    if (document.status !== DOCUMENT_STATUSES.REQUESTED_REVISION) {
      throw ApiError.badRequest();
    }

    // Cannot be
    // - current reviewer
    // - other reviewers in current reviewer's department
    const usersToAcknowledge = document.reviewers.list
      .filter(
        (item) =>
          item.index < document.reviewers.currentReviewerIndex &&
          !item.reviewer.equals(reviewer.id) &&
          item.department !== document.reviewers.currentDepartment
      )
      .map((item) => item.reviewer);

    const revision = await revisionService.getActiveRevision({
      documentId: document.id,
    });

    if (!revision) {
      throw ApiError.badRequest('Revision does not exist.');
    }

    const attachments = await uploadAttachments(files);

    const assignAcknowledgements = revisionService.assignAcknowledgements({
      revisionId: revision.id,
      users: [...usersToAcknowledge, document.requester],
    });

    const saveHistory = historyService.createHistory({
      actor: reviewer.id,
      action: DOCUMENT_ACTIONS.REVISED,
      department: document.reviewers.currentDepartment,
      document: document.id,
      content: remark,
    });

    const saveDocument = document.updateOne({
      ...body,
      attachments: [...document.attachments, ...attachments],
      status: DOCUMENT_STATUSES.REVISED,
    });

    await Promise.all([assignAcknowledgements, saveHistory, saveDocument]);

    const usersToSendTo = [...usersToAcknowledge, document.requester];

    await Promise.all(
      usersToSendTo.map((id) =>
        notificationService.createNotification({
          to: id,
          from: reviewer.id,
          action: DOCUMENT_ACTIONS.REVISED,
          documentId: document.id,
        })
      )
    );

    return document;
  };

  const acknowledgeDocument = async ({ documentId, userId, revisionId }) => {
    const document = await Document.findById(documentId);

    if (document.status !== DOCUMENT_STATUSES.REVISED) {
      throw ApiError.badRequest('Document is not in REVISED status.');
    }

    const revision = await revisionService.acknowledgeRevision({
      revisionId,
      userId,
      documentId,
    });

    const isAllAcknowledged = revision.acknowledgements.every(
      ({ hasAcknowledged }) => hasAcknowledged
    );

    const currReviewerItem = document.reviewers.list.find(
      (reviewerItem) =>
        reviewerItem.index === document.reviewers.currentReviewerIndex
    );

    if (!currReviewerItem) {
      throw ApiError.badRequest('Something went wrong.');
    }

    if (isAllAcknowledged) {
      document.status = DOCUMENT_STATUSES.PENDING;
      document.currentReviewer = currReviewerItem.reviewer;

      await document.save();
    }

    await historyService.createHistory({
      actor: userId,
      action: DOCUMENT_ACTIONS.ACKNOWLEDGED,
      department: document.reviewers.currentDepartment,
      document: document.id,
    });

    await notificationService.createNotification({
      to: document.requester,
      from: userId,
      action: DOCUMENT_ACTIONS.ACKNOWLEDGED,
      documentId: document.id,
    });

    return document;
  };

  const rejectDocument = async ({ documentId, userId, remark }) => {
    const document = await Document.findById(documentId);

    if (!document) {
      throw ApiError.badRequest('Document does not exist.');
    }

    if (document.isCaseClosed) {
      throw ApiError.badRequest('Cannot reject the document.');
    }

    if (!document.currentReviewer.equals(userId)) {
      throw ApiError.badRequest('Cannot reject the document.');
    }

    const currReviewerIdx = document.reviewers.currentReviewerIndex;

    const updatedDocument = await Document.findOneAndUpdate(
      { _id: documentId, 'reviewers.list.index': currReviewerIdx },
      {
        isCaseClosed: true,
        status: DOCUMENT_STATUSES.REJECTED,
        $set: {
          'reviewers.list.$.status': DOCUMENT_ACTIONS.REJECTED,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (updatedDocument.type === DOCUMENT_TYPES.CLAIM) {
      await Document.findByIdAndUpdate(updatedDocument.originalDocument, {
        isCaseClosed: true,
      });
    }

    const saveHistory = historyService.createHistory({
      actor: userId,
      action: DOCUMENT_ACTIONS.REJECTED,
      department: document.reviewers.currentDepartment,
      document: document.id,
      content: remark,
    });

    const saveNoti = notificationService.createNotification({
      to: document.requester,
      from: userId,
      action: DOCUMENT_ACTIONS.REJECTED,
      documentId: document.id,
    });

    await Promise.all([saveHistory, saveNoti]);

    return updatedDocument;
  };

  const getDocumentsToCheck = async ({ user }) => {
    const documents = await Document.find({
      'reviewers.currentReviewerId': user.id,
    }).populate('lastActivity');

    return { documents, total: 0 };
  };

  const commentOnDocument = async ({ id, remark, user }) => {
    const document = await Document.findById(id);

    if (document.status !== DOCUMENT_STATUSES.PENDING) {
      throw ApiError.badRequest('Document has already been approved.');
    }

    if (!document.currentReviewer.equals(user._id)) {
      throw ApiError.badRequest('You are not allowed to comment.');
    }

    await historyService.createHistory({
      actor: user.id,
      action: DOCUMENT_ACTIONS.COMMENTED,
      department: user.department,
      document: document.id,
      content: remark,
    });

    await document.save();

    return document;
  };

  const getDocumentsToAcknowledge = async ({ userId }) => {
    const revisions = await revisionService.getRevisionsToAcknowledge({
      userId,
    });

    const documentIds = revisions.map(({ document }) => document);

    return await Document.find({
      _id: {
        $in: documentIds,
      },
    }).populate('lastActivity');
  };

  const getDocumentById = async ({ id }) => {
    const document = await Document.findById(id)
      .populate('requester')
      .populate('reviewers.list.reviewer', 'name');

    if (!document) {
      throw _noDocumentError;
    }

    return document;
  };

  const getClaimDocumentIdByOriginalId = async ({ originalId }) => {
    const doc = await Document.findOne({ originalDocument: originalId });

    return doc?.id;
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
      .populate('requester')
      .populate({
        path: 'lastActivity',
        populate: {
          path: 'actor',
          select: 'name',
        },
      });

    return { total, documents };
  };

  const updateDocument = async ({
    id,
    attachments,
    data = {},
    isRevisedDoc = false,
  }) => {
    const document = await Document.findById(id);

    if (!document) {
      throw _noDocumentError;
    }

    const status = isRevisedDoc ? DOCUMENT_STATUSES.REVISED : document.status;

    await document.updateOne({
      ...data,
      status,
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
    requestRevision,
    getDocumentById,
    getClaimDocumentIdByOriginalId,
    getAllDocuments,
    getDocumentsToCheck,
    getDocumentsToAcknowledge,
    updateDocument,
    deleteDocument,
    uploadAttachments,
    commentOnDocument,
    invokeDocumentAction,
    reviseDocument,
    acknowledgeDocument,
    rejectDocument,
  };
};
