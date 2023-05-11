const ApiError = require('../helpers/apiError');

module.exports = ({ Revision }) => {
  const createRevision = async ({
    documentId,
    requester,
    reviewer,
    historyId,
  }) => {
    const revisedDocuments = await Revision.find({ document: documentId });

    const acknowledgements = revisedDocuments.map(
      (doc) => doc.acknowledgements
    );

    const isActive = acknowledgements.some((i) => !i.hasAcknowledged);

    if (isActive) {
      throw ApiError.badRequest("There's already an ongoing revision.");
    }

    const revision = await Revision.create({
      document: documentId,
      requester: requester.id,
      reviewer: reviewer.id,
      requestedByDepartment: requester.department,
      reviewDepartment: reviewer.department,
      history: historyId,
    });

    return revision;
  };

  const getRevisionsByDocumentId = async ({ documentId }) => {
    const revisions = await Revision.find({ documentId });

    return revisions;
  };

  const getRevisionById = async (id) => {
    return await Revision.findById(id);
  };

  const getActiveRevision = async ({ documentId, reviewerId }) => {
    const revision = await Revision.findOne({
      document: documentId,
    });

    return revision;
  };

  const assignAcknowledgements = async ({ revisionId, users }) => {
    const revision = await Revision.findByIdAndUpdate(revisionId, {
      acknowledgements: users.map((user) => ({ user, hasAcknowledged: false })),
    });

    return revision;
  };

  const acknowledgeRevision = async ({ revisionId, userId, documentId }) => {
    const revision = await Revision.findById(revisionId);

    if (!revision || revision.document.equals(documentId)) {
      throw ApiError.badRequest('Revision does not exist.');
    }

    const idx = revision.acknowledgements.findIndex(
      (item) => item.user.equals(userId) && !item.hasAcknowledged
    );

    if (!idx === -1) {
      throw ApiError.badRequest('Cannot acknowledge');
    }

    revision.acknowledgements[idx].hasAcknowledged = true;

    await revision.save();

    return revision;
  };

  const getRevisionsToAcknowledge = async ({ userId }) => {
    const revisions = await Revision.find({
      'acknowledgements.user': userId,
      'acknowledgements.hasAcknowledged': false,
    });

    return revisions;
  };

  return {
    createRevision,
    getActiveRevision,
    assignAcknowledgements,
    getRevisionsByDocumentId,
    getRevisionById,
    getRevisionsToAcknowledge,
    acknowledgeRevision,
  };
};
