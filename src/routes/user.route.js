const { userRoles } = require('../constants');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const updateUserSchema = require('../schema/updateUser.schema');

const router = require('express').Router();

router.get(
  '/',
  authenticate,
  authorize([userRoles.superadmin]),
  userController.getAllUsers
);

router.get('/me', authenticate, userController.getMe);

router.get(
  '/:id',
  authenticate,
  authorize([userRoles.superadmin]),
  userController.getUserById
);

router.delete(
  '/:id',
  authenticate,
  authorize([userRoles.superadmin]),
  userController.deleteUserById
);

router.patch(
  '/:id',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(updateUserSchema),
  userController.updateUserById
);

module.exports = router;
