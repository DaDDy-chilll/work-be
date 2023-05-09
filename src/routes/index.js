const router = require('express').Router();

const authRouter = require('./auth.route');
const documentRouter = require('./document.route');
const userRouter = require('./user.route');
const reviewerGroupRouter = require('./reviewer-groups.route');
const historyRouter = require('./history.route');
const notificationRouter = require('./notification.route');

router.use('/auth', authRouter);

router.use('/documents', documentRouter);

router.use('/users', userRouter);

router.use('/reviewer-groups', reviewerGroupRouter);

router.use('/histories', historyRouter);

router.use('/notifications', notificationRouter);

module.exports = router;
