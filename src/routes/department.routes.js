const router = require('express').Router();

const authenticate = require('../middlewares/authenticate');
const isSuperadmin = require('../middlewares/is-superadmin');
const { container } = require('../container');

router.get(
  '/',
  authenticate,
  container.resolve('departmentController').getDepartments
);

router.get(
  '/search',
  authenticate,
  container.resolve('departmentController').searchDepartments
);

router.post(
  '/',
  authenticate,
  isSuperadmin,
  container.resolve('departmentController').createDepartment
);

module.exports = router;
