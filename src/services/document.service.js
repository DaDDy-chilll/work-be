const { getAllDocumentPipeline } = require('../aggregation-pipelines/document');
const { documentStatus, userRoles, documentSections } = require('../constants');
const {
  DOCUMENT_STATUSES,
  DOCUMENT_ACTIONS,
  DOCUMENT_TYPES,
} = require('../constants/document');
const {
  REVIEWER_GROUP_TYPES,
  WORKFLOW_TYPES,
} = require('../constants/reviewer-group');
const {
  checkCanForward,
} = require('../controllers/helpers/reviewer-group.helper');
const { getFileStream } = require('../lib/s3');
const ApiError = require('../utils/apiError');

/**
 * @typedef {Object} Dependencies
 * @property {ReturnType<typeof import('./reviewer-groups.service')>} reviewerGroupService
 * @property {ReturnType<typeof import('./event-emitter.service')>} emitter
 * @property {import('../models/document.model')} Document
 * @property {import('../models/user.model')} User
 * @property {ReturnType<import('../helpers/document.helper')>} documentHelper
 * @property {ReturnType<import('./file-storage.service')>} fileStorageService
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({
  historyService,
  revisionService,
  Document,
  DocumentOrder,
  reviewerGroupService,
  documentHelper,
  emitter,
  fileStorageService,
  User,
  mentionService,
  userHelper,
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

    const workflow = await reviewerGroupService.getReviewerGroupById(
      body.workflowId
    );

    if (workflow?.type === REVIEWER_GROUP_TYPES.PRIVATE) {
      checkCanForward(requester);
    }

    const reviewers = await documentHelper.getReviewersForDocument({
      workflowId: body.workflowId,
      requester,
    });

    const attachments = await fileStorageService.uploadFiles(files);

    let document;
    if (body.createdBy === WORKFLOW_TYPES.PURCHASE_ORDER) {
      document = await DocumentOrder.findByIdAndUpdate(
        { _id: body.orderId },
        {
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
          orderWorkflow: workflow.workflowOrderId,
          lastStep: null,
        },
        { new: true }
      );

      // document = new DocumentOrder({
      //   ...body,
      //   attachments,
      //   requester: requester.id,
      //   requestedByDepartment: requester.department,
      //   status: DOCUMENT_STATUSES.PENDING,
      //   reviewers: {
      //     currentDepartment: reviewers[0].department,
      //     list: reviewers,
      //   },
      //   currentReviewer: reviewers[0].reviewer._id,
      //   isClaimDocument: body.type === DOCUMENT_TYPES.CLAIM,
      //   ...(originalDocumentId && { originalDocument: originalDocumentId }),
      //   orderWorkflow: workflow.workflowOrderId,
      // });
    } else {
      document = new Document({
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
        orderWorkflow: workflow.workflowOrderId,
      });
    }

    await document.save();

    await emitter.emitAsync('document.create', {
      notifications: [
        {
          to: document.currentReviewer,
          from: document.requester,
          action: DOCUMENT_ACTIONS.SUBMITTED,
          documentId: document.id,
          workflowType: body.createdBy,
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
    workflowType,
  }) => {
    const document = await documentHelper.findAndValidateDocument(
      documentId,
      workflowType
    );
    const workflow = await reviewerGroupService.getReviewerGroupById(
      body.workflowId
    );

    if (document.status !== DOCUMENT_STATUSES.PENDING) {
      throw ApiError.badRequest('Cannot perform this action.');
    }

    const mapping = {
      prepare: DOCUMENT_ACTIONS.PREPARED,
      verify: DOCUMENT_ACTIONS.VERIFIED,
      authorize: DOCUMENT_ACTIONS.AUTHORIZE,
      approve: DOCUMENT_ACTIONS.APPROVED,
      comment: DOCUMENT_ACTIONS.COMMENTED,
      forward: DOCUMENT_ACTIONS.FORWARDED,
    };

    let restOfReviewers;

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
      if (action === 'forward') {
        if (workflow?.type !== REVIEWER_GROUP_TYPES.PRIVATE) {
          throw ApiError.badRequest('Please choose private workflow.');
        }
        updater = {
          'reviewers.currentReviewerIndex': document.reviewers.list.length,
        };
      } else if (!nextReviewerItem) {
        updater.isCaseClosed = true;
        updater.status = DOCUMENT_STATUSES.APPROVED;
      } else {
        const updatedCurrentReviewerObj =
          documentHelper.setupNextReviewer(nextReviewerItem);
        updater = { ...updater, ...updatedCurrentReviewerObj };
      }
    }

    const attachments = await fileStorageService.uploadFiles(files);

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

      const newAttachments = [...document.attachments, ...attachments];
      updater.attachments = newAttachments;
    }

    let updatedDocument = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
      ? DocumentOrder
      : Document
    ).findOneAndUpdate(
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

    if (action === 'forward') {
      if (updatedDocument) {
        const reviewersList = workflow?.reviewers.map((item) => ({
          ...item.reviewer.permissions,
          reviewer: item.reviewer,
          index: item.index + updatedDocument.reviewers.list.length,
          department: item.department._id,
          status: 'PENDING',
        }));
        updatedDocument = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
          ? DocumentOrder
          : Document
        ).findOneAndUpdate(
          {
            _id: updatedDocument._id,
          },
          {
            $set: {
              reviewers: {
                currentDepartment: workflow?.reviewers[0].department._id,
                currentReviewerIndex:
                  updatedDocument.reviewers.currentReviewerIndex,
                list: [...updatedDocument.reviewers.list, ...reviewersList],
              },
              currentReviewer: workflow?.reviewers[0].reviewer._id,
            },
          },
          { new: true, runValidators: true }
        );
      }
    }

    if (
      updatedDocument.type === 'CLAIM' &&
      updatedDocument.status === DOCUMENT_STATUSES.APPROVED
    ) {
      const orgDocument = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
        ? DocumentOrder
        : Document
      ).findById(updatedDocument.originalDocument);

      orgDocument.isCaseClosed = true;

      await orgDocument.save();
    }

    const userIdsToSendNoti = [updatedDocument.requester];
    if (nextReviewerItem) {
      userIdsToSendNoti.push(nextReviewerItem.reviewer.id);
    }

    if (action === 'authorize') {
      restOfReviewers = documentHelper.getRestOfNextReviewers(document);

      updatedDocument = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
        ? DocumentOrder
        : Document
      ).findOneAndUpdate(
        {
          _id: document._id,
          'reviewers.list.index': { $gt: currentReviewerItem.index },
        },
        {
          $set: {
            'reviewers.list.$[elem].status': DOCUMENT_STATUSES.ACKNOWLEDGED,
            isCaseClosed: true,
            status: DOCUMENT_STATUSES.AUTHORIZE,
          },
        },
        {
          new: true,
          runValidators: true,
          arrayFilters: [{ 'elem.index': { $gt: currentReviewerItem.index } }],
        }
      );
      userIdsToSendNoti.push(
        ...restOfReviewers.map((item) => item.reviewer.id)
      );
    }

    if (updatedDocument.isCaseClosed && !updatedDocument?.isOrderDocument) {
      let reviewers;
      reviewers = await documentHelper.getReviewersForDocument({
        workflowId: updatedDocument.orderWorkflow,
        workflowType: WORKFLOW_TYPES.PURCHASE_ORDER,
        requester: {
          _id: updatedDocument.requester,
          department: updatedDocument.requestedByDepartment,
        },
      });
      const newRequester = reviewers.map((item) => item.index === 0 && item);

      const orderDocument = new DocumentOrder({
        name: updatedDocument.name,
        type: updatedDocument.type,
        amount: updatedDocument.amount,
        attachments: updatedDocument.attachments,
        description: updatedDocument.description,
        documentRequestId: {
          id: updatedDocument.id,
          documentId: updatedDocument.documentId,
        },
        requester: newRequester[0].reviewer,
        requestedByDepartment: newRequester[0].department,
        status: DOCUMENT_STATUSES.PENDING,
        reviewers: {
          currentDepartment: reviewers[0].department,
          list: reviewers,
        },
        currentReviewer: reviewers[0].reviewer._id,
        isClaimDocument: body.type === DOCUMENT_TYPES.CLAIM,
        originalDocument: updatedDocument.id,
        orderWorkflow: updatedDocument.orderWorkflow,
        lastStep: {
          action: false,
        },
      });
      await orderDocument.save();
    }

    await emitter.emitAsync('document.action', {
      notifications: [...new Set(userIdsToSendNoti)].map((id) => ({
        to: id,
        from: reviewer.id,
        action: mapping[action],
        documentId: updatedDocument.id,
        workflowType: workflowType,
      })),

      history: {
        actor: reviewer.id,
        action: mapping[action],
        department: reviewer.department,
        document: updatedDocument.id,
        content: remark,
        attachments: action === 'prepare' ? [] : attachments,
      },
    });
    const historyPromises = Promise.all(
      restOfReviewers
        ?.sort((a, b) => a.index - b.index)
        ?.map((item) => {
          if (action === 'authorize') {
            return historyService.createHistory({
              actor: item.reviewer.id,
              action: DOCUMENT_ACTIONS.ACKNOWLEDGED,
              department: reviewer.department,
              document: document.id,
            });
          }
          return null;
        })
        .filter(Boolean) || []
    );
    await historyPromises;
    return updatedDocument;
  };

  const invokeReturnAction = async ({
    documentId,
    data: { userId, remark, workflowType },
    actor,
    files,
  }) => {
    const document = await documentHelper.findAndValidateDocument(
      documentId,
      workflowType
    );
    await userHelper.findAndValidateUser(userId);

    const originalReviewers = document.reviewers.list;

    const { canNormalReturn, canAdvanceReturn } = actor.permissions;

    const canRequestRevision =
      (canNormalReturn || canAdvanceReturn) &&
      originalReviewers.filter(
        (item) => item.reviewer._id.toString() === actor._id.toString()
      ).length;

    if (!canRequestRevision) {
      throw ApiError.badRequest('Cannot perform this action');
    }

    // contain
    const originalReviewerIds = originalReviewers.map((item) =>
      item.reviewer._id.toString()
    );
    if (!originalReviewerIds.includes(userId)) {
      throw ApiError.badRequest(
        'This reviewer is not included in chosen workflow'
      );
    }

    // serial
    const currentStage = originalReviewers.filter(
      (item) => item.reviewer._id.toString() === actor._id.toString()
    )[0];

    const requestedStage = originalReviewers.filter(
      (item) => item.reviewer._id.toString() === userId
    )[0];

    const indexDifference = currentStage.index - requestedStage.index;

    if (indexDifference < 0) {
      throw ApiError.badRequest('Cannot request revision to future reviewers.');
    }

    if (indexDifference === 0) {
      throw ApiError.badRequest('Cannot request revision to your own self.');
    }

    if (!canAdvanceReturn && indexDifference !== 1) {
      throw ApiError.badRequest(
        'Current reviewer needs to have (Advance Return) permission.'
      );
    }

    let requestedReviewers = originalReviewers.filter(
      (item) =>
        item.index >= requestedStage.index && item.index < currentStage.index
    );

    requestedReviewers.map((item) => {
      Object.assign(item, { status: DOCUMENT_STATUSES.PENDING });
      return item;
    });

    const attachments = await fileStorageService.uploadFiles(files);

    const updatedDocument = await (workflowType ===
    WORKFLOW_TYPES.PURCHASE_ORDER
      ? DocumentOrder
      : Document
    ).findOneAndUpdate(
      {
        _id: documentId,
      },
      {
        $set: {
          reviewers: {
            currentDepartment: requestedStage.department,
            currentReviewerIndex: requestedStage.index,
            list: document.reviewers.list,
          },
          currentReviewer: requestedStage.reviewer._id,
        },
      },
      { new: true, runValidators: true }
    );

    if (updatedDocument) {
      const userIdsToSendNoti = [updatedDocument.requester];

      for (let i = 0; i < requestedReviewers.length; i++) {
        const stage = requestedReviewers[i];
        userIdsToSendNoti.push(stage.reviewer.id);
      }

      await emitter.emitAsync('document.action', {
        notifications: userIdsToSendNoti.map((id) => ({
          to: id,
          from: actor.id,
          action: DOCUMENT_ACTIONS.REQUESTED_REVISION,
          documentId: updatedDocument.id,
          workflowType: workflowType,
        })),

        history: {
          actor: actor.id,
          action: DOCUMENT_ACTIONS.REQUESTED_REVISION,
          department: actor.department,
          document: updatedDocument.id,
          content: remark,
          attachments,
        },
      });
    }

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

  const rejectDocument = async ({
    documentId,
    userId,
    remark,
    files,
    workflowType,
  }) => {
    const document = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
      ? DocumentOrder
      : Document
    ).findById(documentId);

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

    const attachments = await fileStorageService.uploadFiles(files);

    const updatedDocument = await (workflowType ===
    WORKFLOW_TYPES.PURCHASE_ORDER
      ? DocumentOrder
      : Document
    ).findOneAndUpdate(
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
          workflowType: workflowType,
        },
      ],
      history: {
        actor: userId,
        action: DOCUMENT_ACTIONS.REJECTED,
        department: document.reviewers.currentDepartment,
        document: document.id,
        content: remark,
        attachments,
      },
    });
    return updatedDocument;
  };

  const commentOnDocument = async ({ id, remark, user, workflowType }) => {
    const document = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
      ? DocumentOrder
      : Document
    ).findById(id);

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

  const getDocumentFile = async ({ key }) => {
    return await getFileStream(key);
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

  const getDocumentById = async ({ id, workflowType }) => {
    const document = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
      ? DocumentOrder
      : Document
    )
      .findById(id)
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

  const getAllDocuments = async (query) => {
    const { pipelines, filter } = getAllDocumentPipeline(query);

    if (!query?.workflowType) {
      console.log('query', query);
      console.log('filter----', filter);

      const [documentResults, orderResults] = await Promise.all([
        Document.aggregate([{ $match: filter }, ...pipelines]).then(
          (items) => items[0] || { data: [], count: 0 }
        ),
        DocumentOrder.aggregate([{ $match: filter }, ...pipelines]).then(
          (items) => items[0] || { data: [], count: 0 }
        ),
      ]);

      console.log('documentResults----', documentResults);
      console.log('orderResults----', orderResults);
      return {
        total: documentResults.count + orderResults.count,
        documents: [...documentResults.data, ...orderResults.data],
      };
    }
    console.log('query second------', query);
    // Get documents from specific collection based on workflowType
    const Model =
      query.workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
        ? DocumentOrder
        : Document;

    const { data: documents, count: total } = await Model.aggregate(
      pipelines
    ).then((items) => items[0] || { data: [], count: 0 });

    return { total, documents };
  };

  const updateDocument = async ({
    id,
    attachments,
    data = {},
    isRevisedDoc = false,
    workflowType,
  }) => {
    const document = await (workflowType === WORKFLOW_TYPES.PURCHASE_ORDER
      ? DocumentOrder
      : Document
    ).findById(id);

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

  const mentionDocument = async ({ data, files, workflowType }) => {
    const { reviewers, actor, document: documentId } = data;
    const document = await documentHelper.findAndValidateDocument(
      documentId,
      workflowType
    );

    if (!document) {
      throw _noDocumentError;
    }

    const userIdsToSendNoti = [document.requester];

    for (let i = 0; i < reviewers.length; i++) {
      const mentionedPerson = reviewers[i];

      const user = await User.findById(mentionedPerson);

      if (!user) {
        throw ApiError.badRequest(
          `This user id ( ${mentionedPerson} ) is invalid.`
        );
      }

      userIdsToSendNoti.push(mentionedPerson);
    }

    const attachments = await fileStorageService.uploadFiles(files);

    const mention = await mentionService.createMention({
      ...data,
      attachments,
      workflowType: workflowType,
    });

    if (mention) {
      await emitter.emitAsync('document.mention', {
        notifications: userIdsToSendNoti.map((id) => ({
          to: id,
          from: actor.id,
          action: DOCUMENT_ACTIONS.MENTIONED,
          documentId,
          workflowType: workflowType,
        })),
      });
    }
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
    getDocumentFile,
    mentionDocument,
    invokeReturnAction,
  };
};
