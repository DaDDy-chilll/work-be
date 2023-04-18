const router = require('express').Router();

const { userRoles } = require('../constants');
const docAssigneesGroupsController = require('../controllers/doc-assignees-groups.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createAssigneeSchema = require('../schema/createAssigneesGroup');

router.post(
  '/',
  authenticate,
  authorize([userRoles.superadmin]),
  validate(createAssigneeSchema),
  docAssigneesGroupsController.createAssigneeGroup
);

router.get('/', authenticate, docAssigneesGroupsController.getAssigneesGroup);

module.exports = router;
