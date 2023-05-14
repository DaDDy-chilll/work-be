const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

module.exports = ({ revisionService }) => {
  return Object.freeze({
    getActiveRevision: catchAsync(async (req, res, next) => {
      const { documentId } = req.query;

      const revision = await revisionService.getActiveRevision({
        documentId,
      });

      sendSuccessResponse({
        res,
        data: revision,
      });
    }),
  });
};
