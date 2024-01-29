const { container } = require('../container');
const authenticate = require('../middlewares/authenticate');

const router = require('express').Router();

router.get(
  '/',
  authenticate,
  container.resolve('mentionController').getMentions
);

module.exports = router;
