const { container } = require('../container');
const authenticate = require('../middlewares/authenticate');

const router = require('express').Router();

router.get(
  '/',
  authenticate,
  container.resolve('historyController').getHistories
);

module.exports = router;
