const { EventEmitter2 } = require('eventemitter2');

/**
 * @param {{
 *  notificationService: ReturnType<import('./notification.service')>;
 *  historyService: ReturnType<import('./history.service')>;
 * }}
 */
module.exports = ({ notificationService, historyService }) => {
  const emitter = new EventEmitter2();

  const documentEvents = [
    'document.create',
    'document.action',
    'document.requestRevision',
    'document.revise',
    'document.acknowledge',
    'document.reject',
  ];

  const handleDocumentNotisAndHistory = async ({ notifications, history }) => {
    let notificationsPromise;
    let historyPromise;

    if (notifications) {
      notificationsPromise =
        notificationService.sendNotifications(notifications);
    }

    if (history) {
      historyPromise = historyService.createHistory(history);
    }
    return await Promise.all([notificationsPromise, historyPromise]);
  };

  documentEvents.forEach((event) =>
    emitter.on(event, handleDocumentNotisAndHistory, { promisify: true })
  );

  return emitter;
};
