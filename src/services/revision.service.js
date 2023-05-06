const Revision = require('../models/revisions.model');

const createRevisionService = () => {
  const createRevision = async ({
    documentId,
    requester,
    reviewer,
    historyId,
  }) => {
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

  const getActiveRevision = async ({ documentId }) => {
    const revision = await Revision.findOne({
      document: documentId,
      acknowledgements: {
        $elemMatch: {
          hasAcknowledged: false,
        },
      },
    });

    return revision;
  };

  const assignAcknowledgements = async ({ revisionId, users }) => {
    const revision = await Revision.findByIdAndUpdate(revisionId, {
      acknowledgements: users.map((user) => ({ user, hasAcknowledged: false })),
    });

    return revision;
  };

  return { createRevision, getActiveRevision, assignAcknowledgements };
};

module.exports = createRevisionService;
