const router = require('express').Router();

const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');
const registerUserSchema = require('../schema/registerUser.schema');
const loginUserSchema = require('../schema/loginUser.schema');
const authenticate = require('../middlewares/authenticate');

router.post(
  '/register',
  authenticate,
  validate(registerUserSchema),
  authController.register,
);

router.post('/login', validate(loginUserSchema), authController.login);

module.exports = router;
