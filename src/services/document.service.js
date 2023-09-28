const { documentStatus, userRoles, documentSections } = require('../constants');
const {
  DOCUMENT_STATUSES,
  DOCUMENT_ACTIONS,
  DOCUMENT_TYPES,
} = require('../constants/document');
const ApiError = require('../utils/apiError');

/**
 * @typedef {Object} Dependencies
 * @property {ReturnType<typeof import('./reviewer-groups.service')>} reviewerGroupService
 * @property {ReturnType<typeof import('./event-emitter.service')>} emitter
 * @property {import('../models/document.model')} Document
 * @property {ReturnType<import('../helpers/document.helper')>} documentHelper
 * @property {ReturnType<import('./file-storage.service')>} fileStorageService
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({
  historyService,
  revisionService,
  Document,
  reviewerGroupService,
  documentHelper,
  emitter,
  fileStorageService,
}) => {
  const _noDocumentError = ApiError.badRequest('Document does not exist.');

  // Private methods
  const _canUserUpdateOrDelete = ({ document, user }) => {
    return (
      document.requestedBy.equals(user._id) ||
      user.role === userRoles.superadmin
    );
  };

  // Public Methods
  const createRequisitionDocument = async ({
    body,
    requester,
    files,
    originalDocumentId = undefined,
  }) => {
    if (body.type === DOCUMENT_TYPES.CLAIM) {
      await documentHelper.checkClaimDocument(originalDocumentId);
    }

    // do not let superadmin request
    if (requester.isSuperadmin) {
      throw ApiError.notAuthorized();
    }

    const reviewers = await documentHelper.getReviewersForDocument({
      workflowId: body.workflowId,
      requester,
    });

    const attachments = await fileStorageService.uploadFiles(files);

    const document = new Document({
      ...body,
      attachments,
      requester: requester.id,
      requestedByDepartment: requester.department,
      status: DOCUMENT_STATUSES.PENDING,
      reviewers: {
        currentDepartment: reviewers[0].department,
        list: reviewers,
      },
      currentReviewer: reviewers[0].reviewer._id,
      isClaimDocument: body.type === DOCUMENT_TYPES.CLAIM,
      ...(originalDocumentId && { originalDocument: originalDocumentId }),
    });

    await document.save();

    await emitter.emitAsync('document.create', {
      notifications: [
        {
          to: document.currentReviewer,
          from: document.requester,
          action: DOCUMENT_ACTIONS.SUBMITTED,
          documentId: document.id,
        },
      ],
      history: {
        actor: requester.id,
        department: requester.department,
        action: DOCUMENT_ACTIONS.SUBMITTED,
        document: document.id,
      },
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
    const document = await documentHelper.findAndValidateDocument(documentId);

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
    const currentReviewerItem = documentHelper.getCurrentReviewer(
      document,
      reviewer
    );
    if (!currentReviewerItem) {
      throw ApiError.notAuthorized(`Cannot perform ${action}.`);
    }

    if (!documentHelper.canDoAction(action, reviewer.permissions)) {
      throw ApiError.notAuthorized(`Cannot perform ${action}.`);
    }

    const willGoToNextReviewer = action !== 'comment';
    let updater = { ...body };

    const nextReviewerItem = documentHelper.getNextReviewer(document);
    if (willGoToNextReviewer) {
      if (!nextReviewerItem) {
        updater.isCaseClosed = true;
        updater.status = DOCUMENT_STATUSES.APPROVED;
      }
      const updatedCurrentReviewerObj =
        documentHelper.setupNextReviewer(nextReviewerItem);
      updater = { ...updater, ...updatedCurrentReviewerObj };
    }

    if (action === 'prepare') {
      if (
        body.amount &&
        body.amount > 0 &&
        !reviewer.permissions.canEditAmount
      ) {
        throw ApiError.badRequest(
          'You do not have permissions to edit amount.'
        );
      }
      const attachments = await fileStorageService.uploadFiles(files);

      const newAttachments = [...document.attachments, ...attachments];
      updater.attachments = newAttachments;
    }

    const updatedDocument = await Document.findOneAndUpdate(
      { _id: document._id, 'reviewers.list.index': currentReviewerItem.index },
      {
        ...updater,
        $set: {
          'reviewers.list.$.status':
            action === 'comment' ? 'PENDING' : mapping[action],
        },
      },
      { new: true, runValidators: true }
    );

    if (
      updatedDocument.type === 'CLAIM' &&
      updatedDocument.status === DOCUMENT_STATUSES.APPROVED
    ) {
      const orgDocument = await Document.findById(
        updatedDocument.originalDocument
      );

      orgDocument.isCaseClosed = true;

      await orgDocument.save();
    }

    const userIdsToSendNoti = [updatedDocument.requester];
    if (nextReviewerItem) {
      userIdsToSendNoti.push(nextReviewerItem.reviewer.id);
    }

    await emitter.emitAsync('document.action', {
      notifications: userIdsToSendNoti.map((id) => ({
        to: id,
        from: reviewer.id,
        action: mapping[action],
        documentId: updatedDocument.id,
      })),

      history: {
        actor: reviewer.id,
        action: mapping[action],
        department: reviewer.department,
        document: updatedDocument.id,
        content: remark,
      },
    });

    return updatedDocument;
  };

  const chooseWorkflowForDocument = async ({
    workflowId,
    documentId,
    user,
  }) => {
    const workflow = await reviewerGroupService.getReviewerGroupById(
      workflowId
    );

    if (!workflow) {
      throw ApiError.notFound('Workflow does not exist.');
    }

    const document = await Document.findById(documentId);

    if (document.isWorkflowAssigned) {
      throw ApiError.badRequest('Workflow has already been chosen.');
    }

    if (!document.currentReviewer.equals(user._id)) {
      throw ApiError.notAuthorized();
    }

    if (!user.department.isStartingDepartment) {
      throw ApiError.notAuthorized();
    }

    const addedReviewers = workflow.reviewers
      .map((item) => {
        const index = item.index + document.reviewers.list.length;
        return {
          ...item.reviewer.permissions,
          index,
          reviewer: item.reviewer._id,
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

    await Document.findByIdAndUpdate(documentId, {
      $addToSet: {
        'reviewers.list': {
          $each: addedReviewers,
        },
      },
      isWorkflowAssigned: true,
    });

    return document._id;
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

    if (!reviewer._id.equals(document.currentReviewer)) {
      throw ApiError.notAuthorized();
    }

    const requestedPersonObject = document.reviewers.list.find(
      (r) => r.canEdit
    );
    const requesterObject = document.reviewers.list.find((r) =>
      r.reviewer.equals(reviewer.id)
    );

    if (!requestedPersonObject || !requesterObject) {
      throw ApiError.badRequest('No person to revise.');
    }

    if (requesterObject.index <= requestedPersonObject.index) {
      throw ApiError.badRequest('You can only request person lower than you.');
    }

    const activeRevision = await revisionService.getActiveRevision({
      documentId: document.id,
    });

    if (activeRevision) {
      throw ApiError.badRequest("There's already an ongoing revision.");
    }

    document.status = DOCUMENT_STATUSES.REQUESTED_REVISION;
    document.currentReviewer = requestedPersonObject.reviewer;

    await document.save();
    await revisionService.createRevision({
      documentId: document.id,
      requester: reviewer,
      reviewer: {
        id: requestedPersonObject.reviewer,
        department: requestedPersonObject.department,
      },
      historyId: history.id,
    });

    await emitter.emitAsync('document.requestRevision', {
      notifications: [
        {
          to: requestedPersonObject.reviewer,
          from: reviewer.id,
          action: DOCUMENT_ACTIONS.REQUESTED_REVISION,
          documentId: document.id,
        },
      ],
      history: {
        actor: reviewer.id,
        action: DOCUMENT_ACTIONS.REQUESTED_REVISION,
        department: department,
        document: document.id,
        content: remark,
      },
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
          !item.department.equals(document.reviewers.currentDepartment)
      )
      .map((item) => item.reviewer);

    const revision = await revisionService.getActiveRevision({
      documentId: document.id,
    });

    if (!revision) {
      throw ApiError.badRequest('Revision does not exist.');
    }

    const attachments = await fileStorageService.uploadFiles(files);

    await document.updateOne({
      ...body,
      attachments: [...document.attachments, ...attachments],
      status: DOCUMENT_STATUSES.REVISED,
    });

    await revisionService.assignAcknowledgements({
      revisionId: revision.id,
      users: [...usersToAcknowledge, document.requester],
    });

    const usersToSendTo = [...usersToAcknowledge, document.requester];
    await emitter.emitAsync('document.revise', {
      notifications: usersToSendTo.map((id) => ({
        to: id,
        from: reviewer.id,
        action: DOCUMENT_ACTIONS.REVISED,
        documentId: document.id,
      })),
      history: {
        actor: reviewer.id,
        action: DOCUMENT_ACTIONS.REVISED,
        department: document.reviewers.currentDepartment,
        document: document.id,
        content: remark,
      },
    });
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

    await emitter.emitAsync('document.acknowledge', {
      notifications: [
        {
          to: document.requester,
          from: userId,
          action: DOCUMENT_ACTIONS.ACKNOWLEDGED,
          documentId: document.id,
        },
      ],
      history: {
        actor: userId,
        action: DOCUMENT_ACTIONS.ACKNOWLEDGED,
        department: document.reviewers.currentDepartment,
        document: document.id,
      },
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

    await emitter.emitAsync('document.reject', {
      notifications: [
        {
          to: document.requester,
          from: userId,
          action: DOCUMENT_ACTIONS.REJECTED,
          documentId: document.id,
        },
      ],
      history: {
        actor: userId,
        action: DOCUMENT_ACTIONS.REJECTED,
        department: document.reviewers.currentDepartment,
        document: document.id,
        content: remark,
      },
    });
    return updatedDocument;
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
      .populate({
        path: 'reviewers.list.reviewer',
        populate: 'department',
      });

    if (!document) {
      throw _noDocumentError;
    }

    return document;
  };

  const getClaimDocumentIdByOriginalId = async ({ originalId }) => {
    const doc = await Document.findOne({ originalDocument: originalId });

    return doc?.id;
  };

  const getAllDocuments = async ({ query, user }) => {
    const { sort, limit, skip, filter } =
      documentHelper.transformGetAllDocumentsFilter(query, user);
    const [documents, total] = await Promise.all([
      Document.find(filter)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('requester')
        .populate({
          path: 'lastActivity',
          populate: [
            {
              path: 'actor',
              select: 'name',
            },
            {
              path: 'department',
            },
          ],
        }),
      Document.count(filter),
    ]);

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
    getDocumentsToAcknowledge,
    updateDocument,
    deleteDocument,
    commentOnDocument,
    invokeDocumentAction,
    reviseDocument,
    acknowledgeDocument,
    rejectDocument,
    chooseWorkflowForDocument,
  };
};
