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

  return { createRevision };
};

module.exports = createRevisionService();
