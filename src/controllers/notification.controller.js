const catchAsync = require('../utils/catchAsync');
const sendSuccessResponse = require('../utils/sendSuccessResponse');

/**
 * @typedef {Object} Dependencies
 * @property {ReturnType<import('../services/notification.service')>} notificationService
 *
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ notificationService }) => {
  return Object.freeze({
    getCurrentUserNotifications: catchAsync(async (req, res, next) => {
      const user = req.user;
      const { notifications, count } =
        await notificationService.getNotifications(req.query, user._id);

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

    markAllAsRead: catchAsync(async (req, res, next) => {
      await notificationService.markAllAsRead({ userId: req.user._id });
      sendSuccessResponse({ res, code: 204 });
    }),
  });
};
