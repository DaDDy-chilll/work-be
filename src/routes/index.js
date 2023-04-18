const router = require('express').Router();

const authRouter = require('./auth.route');
const documentRouter = require('./document.route');
const userRouter = require('./user.route');

router.use('/auth', authRouter);

router.use('/documents', documentRouter);

router.use('/users', userRouter);

module.exports = router;
