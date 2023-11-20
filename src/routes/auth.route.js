const router = require('express').Router();

const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const {
  REGISTER_USER,
  LOGIN,
  UPDATE_PASSWORD,
  UPDATE_USER_PASSWORD,
} = require('../schema/user.schema');
const isSuperadmin = require('../middlewares/is-superadmin');
const { container } = require('../container');

router.post(
  '/register',
  authenticate,
  isSuperadmin,
  validate(REGISTER_USER),
  container.resolve('authController').register
);

router.post(
  '/login',
  validate(LOGIN),
  container.resolve('authController').login
);

router.patch(
  '/password',
  authenticate,
  validate(UPDATE_PASSWORD),
  container.resolve('authController').updatePassword
);

router.patch(
  '/:id/password',
  authenticate,
  isSuperadmin,
  validate(UPDATE_USER_PASSWORD),
  container.resolve('authController').updateUserPassword
);

module.exports = router;
