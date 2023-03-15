const Document = require('../models/document.model');

const createDocumentService = () => {
  const createRequisitionForm = async (data) => {
    const document = await Document.create(data);

    return document;
  };

  return {
    createRequisitionForm,
  };
};

module.exports = createDocumentService();
