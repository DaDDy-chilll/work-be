const router = require('express').Router();

const authenticate = require('../middlewares/authenticate');
const isSuperadmin = require('../middlewares/is-superadmin');
const { container } = require('../container');
const validate = require('../middlewares/validate');
const { CREATE_DEPARTMENT } = require('../schema/department.schema');

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
  validate(CREATE_DEPARTMENT),
  container.resolve('departmentController').createDepartment
);

module.exports = router;
