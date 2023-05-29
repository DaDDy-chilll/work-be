const { DOCUMENT_ACTIONS } = require('../constants/document');
const ApiError = require('../helpers/apiError');
const extractQuery = require('../helpers/extractQuery');

/**
 * @typedef {Object} Dependencies
 * @property {typeof import('../models/notification.model')} Notification
 *
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ Notification }) => {
  return Object.freeze({
    createDocAcknowledgementNotification: async ({
      usersToSendTo,
      documentId,
      from,
    }) => {
      await Promise.all(
        usersToSendTo.map((id) =>
          Notification.create({
            to: id,
            action: DOCUMENT_ACTIONS.ACKNOWLEDGED,
            documentId,
            from,
          })
        )
      );
    },

    createNotification: async ({ to, from, action, documentId }) => {
      return await Notification.create({
        to,
        from,
        action,
        documentId,
      });
    },

    getNotifications: async (query) => {
      const { sort, filter, skip, limit } = extractQuery(query, (oldFilter) => {
        const filter = {};

        if (oldFilter.to) {
          filter.to = oldFilter.to;
        }
        return filter;
      });

      const [notifications, count] = await Promise.all([
        Notification.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('from', 'name'),
        Notification.count(filter),
      ]);

      return { notifications, count };
    },

    openNotification: async ({ userId, notificationId }) => {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        throw ApiError.badRequest('Notification does not exist.');
      }

      if (!notification.to.equals(userId)) {
        throw ApiError.notAuthorized();
      }

      notification.isOpen = true;

      await notification.save();

      return notification;
    },
    markAllAsRead: async ({ userId }) => {
      await Notification.updateMany({ to: userId }, { isOpen: true });
      return;
    },
  });
};
