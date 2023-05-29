const router = require('express').Router();

const authenticate = require('../middlewares/authenticate');
const { container } = require('../container');

router.get(
  '/me',
  authenticate,
  container.resolve('notificationController').getCurrentUserNotifications
);

router.patch(
  '/:id',
  authenticate,
  container.resolve('notificationController').openNotification
);

router.post(
  '/all-read',
  authenticate,
  container.resolve('notificationController').markAllAsRead
);

module.exports = router;
