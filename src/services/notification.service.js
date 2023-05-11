const { DOCUMENT_ACTIONS } = require('../constants/document');
const ApiError = require('../helpers/apiError');

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
      console.log(to);
      return await Notification.create({
        to,
        from,
        action,
        documentId,
      });
    },

    getNotifications: async ({ query }) => {
      const tmpQuery = { ...query };

      const [notifications, count] = await Promise.all([
        Notification.find(tmpQuery).populate('from', 'name'),
        Notification.count(tmpQuery),
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
  });
};
