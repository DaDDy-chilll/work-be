const router = require('express').Router();

const authRouter = require('./auth.route');
const documentRouter = require('./document.route');
const userRouter = require('./user.route');
const assigneeGroupRouter = require('./assignees-groups.route');

router.use('/auth', authRouter);

router.use('/documents', documentRouter);

router.use('/users', userRouter);

router.use('/assignee-groups', assigneeGroupRouter);

module.exports = router;
