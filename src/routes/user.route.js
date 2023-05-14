const router = require('express').Router();

const { container } = require('../container');

const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const checkParamsId = require('../schema/checkParamsId.schema');
const { UPDATE_USER, GET_USERS } = require('../schema/user.schema');
const isSuperadmin = require('../middlewares/is-superadmin');

router.get(
  '/',
  authenticate,
  validate(GET_USERS),
  container.resolve('userController').getAllUsers
);

router.get('/me', authenticate, container.resolve('userController').getMe);

router.get(
  '/:id',
  authenticate,
  isSuperadmin,
  validate(checkParamsId),
  container.resolve('userController').getUserById
);

router.delete(
  '/:id',
  authenticate,
  isSuperadmin,
  validate(checkParamsId),
  container.resolve('userController').deleteUserById
);

router.patch(
  '/:id',
  authenticate,
  isSuperadmin,
  validate(UPDATE_USER),
  container.resolve('userController').updateUserById
);

router.get(
  '/approval-eligibility/:dept',
  authenticate,
  container.resolve('userController').getValidReviewers
);

router.post(
  '/approval-eligibility/:dept',
  authenticate,
  // validate(checkApprovalEligibilitySchema),
  container.resolve('userController').checkApprovalEligibilityForUsers
);

module.exports = router;
