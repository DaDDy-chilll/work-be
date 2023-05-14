const { container } = require('../container');
const authenticate = require('../middlewares/authenticate');

const router = require('express').Router();

router.get(
  '/active',
  authenticate,
  container.resolve('revisionController').getActiveRevision
);

module.exports = router;
