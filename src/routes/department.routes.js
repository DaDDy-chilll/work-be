const router = require('express').Router();

const authenticate = require('../middlewares/authenticate');
const isSuperadmin = require('../middlewares/is-superadmin');
const { container } = require('../container');

router.post(
  '/',
  authenticate,
  isSuperadmin,
  container.resolve('departmentController').createDepartment
);

module.exports = router;
