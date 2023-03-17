const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const checkSuperadmin = require('../middlewares/checkSuperadmin');
const validate = require('../middlewares/validate');
const updateUserSchema = require('../schema/updateUser.schema');

const router = require('express').Router();

// router.get('/', authenticate, checkSuperadmin, userController.getAllUsers);

// router.get('/me', authenticate, userController.getMe);

// router.get('/:id', authenticate, checkSuperadmin, userController.getUserById);

// router.delete(
//   '/:id',
//   authenticate,
//   checkSuperadmin,
//   userController.deleteUserById
// );

// router.patch(
//   '/:id',
//   authenticate,
//   checkSuperadmin,
//   validate(updateUserSchema),
//   userController.updateUserById
// );

module.exports = router;
