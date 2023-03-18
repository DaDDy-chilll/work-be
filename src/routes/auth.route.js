const router = require('express').Router();

const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');
const registerUserSchema = require('../schema/registerUser.schema');
const loginUserSchema = require('../schema/loginUser.schema');
const authenticate = require('../middlewares/authenticate');
const checkSuperadmin = require('../middlewares/checkSuperadmin');
const authorize = require('../middlewares/authorize');
const { userRoles } = require('../constants');
const updatePasswordSchema = require('../schema/updatePassword.schema');

router.post(
  '/register',
  authenticate,
  checkSuperadmin,
  validate(registerUserSchema),
  authController.register
);

router.post('/login', validate(loginUserSchema), authController.login);

router.patch(
  '/password/:id',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(updatePasswordSchema),
  authController.updatePassword
);

module.exports = router;
