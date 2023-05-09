const { DOCUMENT_ACTIONS } = require('../constants/document');

module.exports = ({ Notification }) => {
  return Object.freeze({
    createDocAcknowledgementNotification: async ({
      usersToSendTo,
      documentId,
    }) => {
      await Promise.all(
        usersToSendTo.map((id) =>
          Notification.create({
            to: id,
            action: DOCUMENT_ACTIONS.ACKNOWLEDGED,
            documentId,
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
  });
};
