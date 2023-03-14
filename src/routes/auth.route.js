const router = require('express').Router();

const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');
const registerUserSchema = require('../schema/registerUser.schema');

router.post('/register', validate(registerUserSchema), authController.register);

router.post('/login', authController.login);

module.exports = router;
