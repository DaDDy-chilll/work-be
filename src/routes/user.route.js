const { userRoles } = require('../constants');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const checkParamsId = require('../schema/checkParamsId.schema');
const { UPDATE_USER, GET_USERS } = require('../schema/user.schema');

const router = require('express').Router();

router.get('/', authenticate, validate(GET_USERS), userController.getAllUsers);

router.get('/me', authenticate, userController.getMe);

router.get(
  '/:id',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(checkParamsId),
  userController.getUserById
);

router.delete(
  '/:id',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(checkParamsId),
  userController.deleteUserById
);

router.patch(
  '/:id',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(UPDATE_USER),
  userController.updateUserById
);

router.get(
  '/approval-eligibility/:dept',
  authenticate,
  userController.getValidReviewers
);

router.post(
  '/approval-eligibility/:dept',
  authenticate,
  // validate(checkApprovalEligibilitySchema),
  userController.checkApprovalEligibilityForUsers
);

module.exports = router;
