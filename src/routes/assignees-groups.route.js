const router = require('express').Router();

const { userRoles } = require('../constants');
const assigneesGroupsController = require('../controllers/assignee-groups.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createAssigneeSchema = require('../schema/createAssigneesGroup');

router.post(
  '/',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(createAssigneeSchema),
  assigneesGroupsController.createAssigneeGroup
);

router.get('/', authenticate, assigneesGroupsController.getAssigneesGroup);

module.exports = router;
