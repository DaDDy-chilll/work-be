const { documentRemarkActions, documentStatus } = require('../constants');
const Document = require('../models/document.model');

const createDocumentService = () => {
  const createRequisitionForm = async (data) => {
    const document = await Document.create(data);

    return document;
  };

  // TODO: Do not verify a doucment that's already been verified
  // or rejected or approved.
  const verifyForm = async ({ id, userId, remark = undefined }) => {
    const document = await Document.findByIdAndUpdate(
      id,
      {
        verifiedBy: userId,
        status: documentStatus.verified,
        ...(typeof remark === 'string' && remark !== ''
          ? {
              $push: {
                remarks: {
                  remarker: userId,
                  content: remark,
                  action: documentRemarkActions.verify,
                },
              },
            }
          : undefined),
      },
      { new: true },
    );

    return document;
  };

  return {
    createRequisitionForm,
    verifyForm,
  };
};

module.exports = createDocumentService();
