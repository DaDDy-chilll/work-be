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
            type: 'ACKNOWLEDGE',
            documentId,
          })
        )
      );
    },

    createNotification: async ({ type, to, from, action, documentId }) => {
      return await Notification.create({
        to,
        type,
        from,
        action,
        documentId,
      });
    },
  });
};
