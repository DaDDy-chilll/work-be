const catchAsync = require('../utils/catchAsync');
const sendSuccessResponse = require('../utils/sendSuccessResponse');

module.exports = ({ mentionService }) => {
  return Object.freeze({
    getMentions: catchAsync(async (req, res, next) => {
      const { documentId } = req.query;

      const mentions = await mentionService.getMentions({ documentId });

      sendSuccessResponse({
        res,
        data: mentions,
        total: mentions.length,
      });
    }),
  });
};
