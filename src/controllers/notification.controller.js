const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

module.exports = ({ notificationService }) => {
  return Object.freeze({
    getCurrentUserNotifications: catchAsync(async (req, res, next) => {
      const userId = req.user.id;

      const { notifications, count } = notificationService.getNotifications({
        query: {
          to: userId,
        },
      });

      sendSuccessResponse({
        res,
        data: notifications,
        total: count,
      });
    }),
  });
};
