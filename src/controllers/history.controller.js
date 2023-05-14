const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

module.exports = ({ historyService }) => {
  return Object.freeze({
    getHistories: catchAsync(async (req, res, next) => {
      const { documentId } = req.query;

      const histories = await historyService.getHistories({ documentId });

      sendSuccessResponse({
        res,
        data: histories,
        total: histories.length,
      });
    }),
  });
};
