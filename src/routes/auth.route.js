const router = require('express').Router();

const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const {
  REGISTER_USER,
  LOGIN,
  UPDATE_PASSWORD,
} = require('../schema/user.schema');
const isSuperadmin = require('../middlewares/is-superadmin');

router.post(
  '/register',
  authenticate,
  isSuperadmin,
  validate(REGISTER_USER),
  authController.register
);

router.post('/login', validate(LOGIN), authController.login);

router.patch(
  '/password/:id',
  authenticate,
  isSuperadmin,
  validate(UPDATE_PASSWORD),
  authController.updatePassword
);

module.exports = router;
