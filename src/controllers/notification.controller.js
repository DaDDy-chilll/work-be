const catchAsync = require('../helpers/catchAsync');
const sendSuccessResponse = require('../helpers/sendSuccessResponse');

module.exports = ({ notificationService }) => {
  return Object.freeze({
    getCurrentUserNotifications: catchAsync(async (req, res, next) => {
      const { notifications, count } =
        await notificationService.getNotifications(req.query);

      sendSuccessResponse({
        res,
        data: notifications,
        total: count,
      });
    }),
    openNotification: catchAsync(async (req, res, next) => {
      const userId = req.user.id;

      const { id: notificationId } = req.params;

      const notification = await notificationService.openNotification({
        userId,
        notificationId,
      });

      sendSuccessResponse({
        res,
        data: notification,
      });
    }),
  });
};
